import os
import io
import shutil
import tempfile
from PIL import Image, ImageDraw
from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import Group, User
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from .models import (
    ProfilUtilisateur,
    Signalement,
    UserRole,
    is_responsable_municipal,
)
from .privacy_blur import anonymize_image

# Création d'un dossier temporaire pour isoler les fichiers médias générés par les tests
TEMP_MEDIA_ROOT = tempfile.mkdtemp()


def _create_synthetic_plate_image() -> bytes:
    """Génère une image simulant une plaque d'immatriculation bien contrastée avec métadonnées EXIF."""
    img = Image.new('RGB', (400, 300), color=(120, 120, 120))
    draw = ImageDraw.Draw(img)
    # Rectangle de format plaque d'immatriculation (ratio ~ 3.5)
    draw.rectangle([100, 120, 240, 160], fill=(255, 255, 255), outline=(0, 0, 0), width=4)
    draw.text((120, 132), "123 TUN 456", fill=(0, 0, 0))

    buffer = io.BytesIO()
    exif = img.getexif()
    exif[0x010F] = "Samsung Citizen"
    exif[0x0110] = "Galaxy S22"
    img.save(buffer, format='JPEG', exif=exif)
    buffer.seek(0)
    return buffer.getvalue()


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class PrivacyBlurServiceTest(TestCase):
    """
    Tests unitaires du service de vision par ordinateur (anonymisation & floutage INPDP).
    """

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

    def test_anonymize_image_detects_and_blurs(self):
        """Vérifie que la fonction anonymize_image s'exécute, détecte la plaque et purge les EXIF."""
        raw_bytes = _create_synthetic_plate_image()
        upload_file = SimpleUploadedFile("incident_plaque.jpg", raw_bytes, content_type="image/jpeg")

        processed_file, zones_detected, success = anonymize_image(upload_file)

        self.assertTrue(success, "Le service d'anonymisation doit retourner un succès.")
        self.assertGreaterEqual(zones_detected, 1, "La plaque d'immatriculation doit être détectée.")
        self.assertIsNotNone(processed_file, "Un fichier processed ContentFile doit être renvoyé.")

        # Vérification de la suppression intégrale des métadonnées EXIF (Conformité INPDP)
        out_img = Image.open(processed_file)
        out_exif = out_img.getexif()
        self.assertEqual(len(out_exif.keys()), 0, "Toutes les métadonnées EXIF doivent être supprimées.")

    def test_signalement_auto_blur_on_save(self):
        """
        Vérifie l'intégration Django : à la création d'un signalement avec photo,
        le floutage s'exécute automatiquement, les drapeaux passent à True et
        le fichier anonymisé est enregistré sur le disque.
        """
        raw_bytes = _create_synthetic_plate_image()
        uploaded = SimpleUploadedFile("citoyen_nid_de_poule.jpg", raw_bytes, content_type="image/jpeg")

        signalement = Signalement.objects.create(
            categorie=Signalement.Categorie.NID_DE_POULE,
            gravite=Signalement.Gravite.MOYENNE,
            description="Nid-de-poule dangereux avenue Habib Bourguiba",
            latitude=36.8005,
            longitude=10.1800,
            adresse_texte="Avenue Habib Bourguiba, Tunis",
            quartier="Centre-Ville Tunis",
            photo_floutee=uploaded,
        )

        # 1. Vérification des indicateurs d'anonymisation dans le modèle
        self.assertTrue(signalement.visages_plaques_floutes, "Le drapeau visages_plaques_floutes doit passer à True.")
        self.assertGreaterEqual(signalement.nb_zones_floutees, 1, "Le nombre de zones floutées doit être supérieur ou égal à 1.")

        # 2. Vérification de la présence physique de l'image sur le disque (MEDIA_ROOT)
        self.assertTrue(bool(signalement.photo_floutee), "Le champ photo_floutee doit contenir un fichier.")
        self.assertTrue(os.path.exists(signalement.photo_floutee.path), "Le fichier anonymisé doit exister sur le disque.")
        self.assertGreater(os.path.getsize(signalement.photo_floutee.path), 0, "Le fichier ne doit pas être vide.")

        # 3. Vérification de la purge EXIF sur le fichier stocké sur le disque
        saved_img = Image.open(signalement.photo_floutee.path)
        self.assertEqual(len(saved_img.getexif().keys()), 0, "L'image stockée ne doit contenir aucune donnée EXIF.")

    def test_signalement_without_photo(self):
        """Vérifie qu'un signalement sans photo se sauvegarde sans erreur ni déclenchement inutile."""
        signalement = Signalement.objects.create(
            categorie=Signalement.Categorie.ECLAIRAGE,
            gravite=Signalement.Gravite.FAIBLE,
            description="Lampadaire éteint",
            latitude=36.8100,
            longitude=10.1700,
            adresse_texte="Rue de Rome, Tunis",
        )
        self.assertFalse(signalement.visages_plaques_floutes)
        self.assertEqual(signalement.nb_zones_floutees, 0)
        self.assertFalse(bool(signalement.photo_floutee))


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class SignalementAPITest(TestCase):
    """
    Tests d'intégration de l'API REST DRF (/api/signalements/) et du Rate Limiting anti-spam.
    """

    def setUp(self):
        self.client = APIClient()
        cache.clear()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

    def test_create_signalement_api_with_photo(self):
        """Vérifie la création d'un signalement via POST API avec téléversement d'image et anonymisation."""
        raw_bytes = _create_synthetic_plate_image()
        photo = SimpleUploadedFile("api_plaque.jpg", raw_bytes, content_type="image/jpeg")

        payload = {
            'categorie': 'NID_DE_POULE',
            'gravite': 'MOYENNE',
            'description': 'Nid-de-poule signalé via application mobile citoyenne',
            'latitude': 36.8000,
            'longitude': 10.1800,
            'adresse_texte': 'Avenue Habib Bourguiba, Tunis',
            'quartier': 'Centre-Ville Tunis',
            'photo_floutee': photo,
        }

        response = self.client.post('/api/signalements/', payload, format='multipart', REMOTE_ADDR='196.203.45.10')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertIn('id', data)
        self.assertEqual(data['categorie'], 'NID_DE_POULE')
        self.assertEqual(data['quartier'], 'Centre-Ville Tunis')
        self.assertEqual(data['statut'], 'EN_ATTENTE')
        self.assertTrue(data['visages_plaques_floutes'])
        self.assertGreaterEqual(data['nb_zones_floutees'], 1)
        self.assertEqual(data['ip_emetteur'], '196.203.45.10')
        self.assertIsNotNone(data['photo_floutee'])

    def test_rate_limiting_anti_spam(self):
        """
        Vérifie le Rate Limiting (5 créations max par heure par IP).
        Le 6ème signalement émis en moins d'1h depuis la même IP doit retourner 429 Too Many Requests.
        """
        cache.clear()
        client_ip = '197.100.50.25'

        payload = {
            'categorie': 'ACCIDENT',
            'gravite': 'ELEVEE',
            'description': 'Accident léger sur la voie publique',
            'latitude': 36.8120,
            'longitude': 10.1780,
            'adresse_texte': 'Bab El Khadra, Tunis',
            'quartier': 'Bab El Khadra',
        }

        # Les 5 premiers signalements doivent être acceptés (201 Created)
        for i in range(5):
            res = self.client.post('/api/signalements/', payload, format='json', REMOTE_ADDR=client_ip)
            self.assertEqual(res.status_code, status.HTTP_201_CREATED, f"Requête {i+1} doit réussir.")

        # Le 6ème signalement doit être bloqué par le Throttle (429 Too Many Requests)
        blocked_res = self.client.post('/api/signalements/', payload, format='json', REMOTE_ADDR=client_ip)
        self.assertEqual(
            blocked_res.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Le 6ème signalement doit être rejeté avec le code HTTP 429."
        )

        # Une adresse IP différente doit toujours pouvoir poster sans être bloquée
        other_ip_res = self.client.post('/api/signalements/', payload, format='json', REMOTE_ADDR='197.200.10.99')
        self.assertEqual(other_ip_res.status_code, status.HTTP_201_CREATED)

    def test_filter_signalements_by_quartier_and_statut(self):
        """Vérifie le filtrage de l'API par quartier, statut et catégorie."""
        Signalement.objects.create(
            categorie=Signalement.Categorie.DECHETS,
            latitude=36.81,
            longitude=10.18,
            quartier="Lafayette",
            statut=Signalement.Statut.EN_ATTENTE,
        )
        Signalement.objects.create(
            categorie=Signalement.Categorie.ECLAIRAGE,
            latitude=36.82,
            longitude=10.19,
            quartier="Centre-Ville Tunis",
            statut=Signalement.Statut.RESOLU,
        )

        # Filtre par quartier
        res_quartier = self.client.get('/api/signalements/?quartier=Lafayette')
        self.assertEqual(res_quartier.status_code, status.HTTP_200_OK)
        items = res_quartier.json()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['quartier'], 'Lafayette')

        # Filtre par statut
        res_statut = self.client.get('/api/signalements/?statut=RESOLU')
        self.assertEqual(res_statut.status_code, status.HTTP_200_OK)
        items_statut = res_statut.json()
        self.assertEqual(len(items_statut), 1)
        self.assertEqual(items_statut[0]['statut'], 'RESOLU')


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class SignalementSecurityPermissionsTest(TestCase):
    """
    Tests unitaires de sécurité et contrôle d'accès par rôles (RBAC) :
      - Citoyen / Utilisateur non authentifié : création autorisée, actions de supervision/statut bloquées (403).
      - Responsable Municipal : accès complet de supervision, statistiques et gestion des statuts.
    """

    def setUp(self):
        self.client = APIClient()
        cache.clear()

        # 1. Création d'un utilisateur Citoyen (profil CITOYEN créé automatiquement par signal)
        self.citoyen = User.objects.create_user(
            username='citoyen_tunis',
            password='CitoyenPassword123!'
        )

        # 2. Création d'un Responsable Municipal
        self.responsable = User.objects.create_user(
            username='responsable_mairie',
            password='MairiePassword123!'
        )
        self.responsable.profil.role = UserRole.RESPONSABLE_MUNICIPAL
        self.responsable.profil.save()

        # 3. Signalement de test
        self.signalement = Signalement.objects.create(
            categorie=Signalement.Categorie.NID_DE_POULE,
            gravite=Signalement.Gravite.ELEVEE,
            description="Affaissement chaussée avenue Mohammed V",
            latitude=36.8065,
            longitude=10.1815,
            adresse_texte="Avenue Mohammed V, Tunis",
            quartier="Centre-Ville Tunis",
            ip_emetteur="196.200.10.50",
        )

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

    def test_profil_roles_attribution(self):
        """Vérifie l'attribution automatique des rôles et la reconnaissance via groupe Django."""
        self.assertEqual(self.citoyen.profil.role, UserRole.CITOYEN)
        self.assertFalse(is_responsable_municipal(self.citoyen))

        self.assertEqual(self.responsable.profil.role, UserRole.RESPONSABLE_MUNICIPAL)
        self.assertTrue(is_responsable_municipal(self.responsable))

        # Vérifie aussi la reconnaissance via les groupes natifs Django
        citoyen_groupe = User.objects.create_user(username='agent_groupe', password='Pwd123!')
        self.assertFalse(is_responsable_municipal(citoyen_groupe))
        groupe_resp, _ = Group.objects.get_or_create(name=UserRole.RESPONSABLE_MUNICIPAL)
        citoyen_groupe.groups.add(groupe_resp)
        self.assertTrue(is_responsable_municipal(citoyen_groupe))

    def test_unauthenticated_blocked_on_responsable_actions(self):
        """Un utilisateur non authentifié reçoit HTTP 403 sur toutes les actions du Responsable Municipal."""
        url_detail = f'/api/signalements/{self.signalement.id}/'

        res_patch = self.client.patch(url_detail, {'statut': 'RESOLU'}, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)

        res_put = self.client.put(url_detail, {'statut': 'RESOLU'}, format='json')
        self.assertEqual(res_put.status_code, status.HTTP_403_FORBIDDEN)

        res_delete = self.client.delete(url_detail)
        self.assertEqual(res_delete.status_code, status.HTTP_403_FORBIDDEN)

        res_changer = self.client.patch(f'{url_detail}changer-statut/', {'statut': 'RESOLU'}, format='json')
        self.assertEqual(res_changer.status_code, status.HTTP_403_FORBIDDEN)

        res_stats = self.client.get('/api/signalements/statistiques/')
        self.assertEqual(res_stats.status_code, status.HTTP_403_FORBIDDEN)

        res_supervision = self.client.get('/api/signalements/supervision/')
        self.assertEqual(res_supervision.status_code, status.HTTP_403_FORBIDDEN)

        self.signalement.refresh_from_db()
        self.assertEqual(self.signalement.statut, Signalement.Statut.EN_ATTENTE)

    def test_citoyen_can_create_but_blocked_on_responsable_actions(self):
        """
        Un citoyen authentifié peut déposer un signalement (sans pouvoir forcer son statut),
        ne voit pas les IP d'autres citoyens, et reçoit HTTP 403 sur les actions municipales.
        """
        self.client.force_authenticate(user=self.citoyen)

        # 1. Le citoyen peut créer un signalement (POST) mais pas forcer statut=RESOLU
        payload = {
            'categorie': 'DECHETS',
            'gravite': 'MOYENNE',
            'description': 'Dépôt de déchets sur le trottoir',
            'latitude': 36.8150,
            'longitude': 10.1850,
            'quartier': 'Lafayette',
            'statut': 'RESOLU',  # Tentative d'élévation de privilège à ignorer
        }
        res_create = self.client.post('/api/signalements/', payload, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        created_data = res_create.json()
        self.assertEqual(created_data['statut'], Signalement.Statut.EN_ATTENTE)
        self.assertEqual(created_data['auteur'], self.citoyen.id)

        # 2. En lecture publique, l'IP émetteur est masquée au citoyen (INPDP)
        res_list = self.client.get('/api/signalements/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        for item in res_list.json():
            self.assertNotIn('ip_emetteur', item)

        # 3. Le citoyen est bloqué (403) s'il tente de modifier le statut ou d'accéder aux stats/supervision
        url_detail = f'/api/signalements/{self.signalement.id}/'
        self.assertEqual(
            self.client.patch(url_detail, {'statut': 'RESOLU'}, format='json').status_code,
            status.HTTP_403_FORBIDDEN
        )
        self.assertEqual(
            self.client.post(f'{url_detail}changer-statut/', {'statut': 'EN_COURS'}, format='json').status_code,
            status.HTTP_403_FORBIDDEN
        )
        self.assertEqual(
            self.client.delete(url_detail).status_code,
            status.HTTP_403_FORBIDDEN
        )
        self.assertEqual(
            self.client.get('/api/signalements/statistiques/').status_code,
            status.HTTP_403_FORBIDDEN
        )
        self.assertEqual(
            self.client.get('/api/signalements/supervision/').status_code,
            status.HTTP_403_FORBIDDEN
        )

        self.signalement.refresh_from_db()
        self.assertEqual(self.signalement.statut, Signalement.Statut.EN_ATTENTE)

    def test_responsable_municipal_full_supervision_access(self):
        """
        Le Responsable Municipal dispose d'un accès complet : changement de statut,
        statistiques avancées, vue de supervision avec IP émettrice et suppression.
        """
        self.client.force_authenticate(user=self.responsable)
        url_detail = f'/api/signalements/{self.signalement.id}/'

        # 1. Modification du statut via PATCH standard
        res_patch = self.client.patch(url_detail, {'statut': 'EN_COURS'}, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.json()['statut'], Signalement.Statut.EN_COURS)
        self.signalement.refresh_from_db()
        self.assertEqual(self.signalement.statut, Signalement.Statut.EN_COURS)

        # 2. Modification du statut via action dédiée /changer-statut/
        res_changer = self.client.post(
            f'{url_detail}changer-statut/',
            {'statut': 'RESOLU'},
            format='json'
        )
        self.assertEqual(res_changer.status_code, status.HTTP_200_OK)
        self.assertEqual(res_changer.json()['statut'], Signalement.Statut.RESOLU)
        self.signalement.refresh_from_db()
        self.assertEqual(self.signalement.statut, Signalement.Statut.RESOLU)

        # 3. Accès aux statistiques avancées
        res_stats = self.client.get('/api/signalements/statistiques/')
        self.assertEqual(res_stats.status_code, status.HTTP_200_OK)
        stats_data = res_stats.json()
        self.assertGreaterEqual(stats_data['total_signalements'], 1)
        self.assertIn('par_statut', stats_data)
        self.assertIn('conformite_inpdp', stats_data)
        self.assertEqual(stats_data['taux_resolution_pourcent'], 100.0)

        # 4. Accès au rapport global de supervision (incluant ip_emetteur)
        res_supervision = self.client.get('/api/signalements/supervision/')
        self.assertEqual(res_supervision.status_code, status.HTTP_200_OK)
        sup_data = res_supervision.json()
        self.assertGreaterEqual(sup_data['total'], 1)
        self.assertEqual(sup_data['signalements'][0]['ip_emetteur'], '196.200.10.50')

        # 5. Suppression autorisée pour le Responsable Municipal
        res_delete = self.client.delete(url_detail)
        self.assertEqual(res_delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Signalement.objects.filter(id=self.signalement.id).exists())

    def test_jwt_bearer_authentication_flow(self):
        """
        Vérifie l'authentification via /api/signalements/auth/login/ (JWT Bearer)
        et l'injection de l'en-tête Authorization: Bearer <token>.
        """
        # 1. Mauvais identifiants -> 401
        res_bad = self.client.post(
            '/api/signalements/auth/login/',
            {'username': 'responsable_mairie', 'password': 'WrongPassword'},
            format='json',
        )
        self.assertEqual(res_bad.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Connexion Citoyen -> token avec role=CITOYEN, bloqué (403) sur /statistiques/
        res_cit = self.client.post(
            '/api/signalements/auth/login/',
            {'username': 'citoyen_tunis', 'password': 'CitoyenPassword123!'},
            format='json',
        )
        self.assertEqual(res_cit.status_code, status.HTTP_200_OK)
        cit_token = res_cit.json()['access']
        self.assertEqual(res_cit.json()['user']['role'], UserRole.CITOYEN)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {cit_token}')
        self.assertEqual(
            self.client.get('/api/signalements/statistiques/').status_code,
            status.HTTP_403_FORBIDDEN,
        )

        # 3. Connexion Responsable Municipal -> token Bearer accepté sur /auth/me/, /statistiques/, /changer-statut/
        self.client.credentials()  # reset
        res_resp = self.client.post(
            '/api/signalements/auth/login/',
            {'username': 'responsable_mairie', 'password': 'MairiePassword123!'},
            format='json',
        )
        self.assertEqual(res_resp.status_code, status.HTTP_200_OK)
        resp_data = res_resp.json()
        self.assertEqual(resp_data['user']['role'], UserRole.RESPONSABLE_MUNICIPAL)
        self.assertTrue(resp_data['user']['est_responsable_municipal'])

        resp_token = resp_data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp_token}')

        res_me = self.client.get('/api/signalements/auth/me/')
        self.assertEqual(res_me.status_code, status.HTTP_200_OK)
        self.assertEqual(res_me.json()['username'], 'responsable_mairie')

        res_stats = self.client.get('/api/signalements/statistiques/')
        self.assertEqual(res_stats.status_code, status.HTTP_200_OK)

        res_statut = self.client.post(
            f'/api/signalements/{self.signalement.id}/changer-statut/',
            {'statut': 'EN_COURS'},
            format='json',
        )
        self.assertEqual(res_statut.status_code, status.HTTP_200_OK)
        self.assertEqual(res_statut.json()['statut'], Signalement.Statut.EN_COURS)

        # 4. Jeton invalide / falsifié -> 401 Unauthorized
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid.jwt.token')
        res_tampered = self.client.get('/api/signalements/statistiques/')
        self.assertEqual(res_tampered.status_code, status.HTTP_401_UNAUTHORIZED)


