from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from .models import SignalementAccident, AlerteAccident, JournalAudit, RequeteAssistantLLM
from .services import (
    traiter_signalement,
    executer_transition_workflow,
    SEUIL_CONFIRMATION_AUTOMATIQUE,
    RAYON_PROXIMITE_METRES,
)
from .ml_models import prediger_risque_zone, obtenir_tous_secteurs_evalues
from .llm_assistant import interroger_llm

class Etudiant3UrgencesTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    # =========================================================================
    # 1. Tests Priorité 1 : Backend & Diffusion d'urgences (< 5s)
    # =========================================================================
    def test_lister_casernes_grand_tunis(self):
        """Vérifie que la liste des casernes de pompiers du Grand Tunis est disponible."""
        response = self.client.get('/api/urgences/casernes/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data) >= 5)
        self.assertEqual(response.data[0]['nom'], 'Caserne Centrale — Bab El Khadra')

    def test_simuler_accident_direct(self):
        """Vérifie qu'un accident simulé est immédiatement qualifié et émis."""
        response = self.client.post('/api/urgences/simuler-accident/', {
            'adresse': 'Échangeur Bab Alioua, Sortie Sud',
            'latitude': 36.7865,
            'longitude': 10.1832,
            'gravite': 'GRAVE'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('alerte_id', response.data)
        self.assertEqual(response.data['statut'], 'CONFIRME')

        # Vérifier que l'alerte existe dans la base
        alerte = AlerteAccident.objects.get(id=response.data['alerte_id'])
        self.assertIsNotNone(alerte.date_confirmation)

    # =========================================================================
    # 2. Tests Priorité 2 : Qualification PostGIS & Workflow d'Intervention
    # =========================================================================
    def test_regroupement_spatial_postgis_et_elimination_fausses_alertes(self):
        """
        Vérifie l'algorithme spatial :
        - Un signalement isolé reste en 'A_CONFIRMER' (anti-fausse alerte).
        - 3 signalements dans un rayon <= 150m qualifient l'alerte en 'CONFIRME'.
        """
        # 1er signalement isolé
        sig1 = SignalementAccident.objects.create(
            latitude=36.8000,
            longitude=10.1800,
            adresse='Avenue Bourguiba',
            gravite_estimee='GRAVE'
        )
        alerte = traiter_signalement(sig1)
        self.assertEqual(alerte.statut, 'A_CONFIRMER')
        self.assertEqual(alerte.nb_signalements, 1)

        # 2ème signalement concordant à 50 mètres
        sig2 = SignalementAccident.objects.create(
            latitude=36.8003,
            longitude=10.1802,
            adresse='Avenue Bourguiba angle Paris',
            gravite_estimee='GRAVE'
        )
        alerte = traiter_signalement(sig2)
        self.assertEqual(alerte.statut, 'A_CONFIRMER')
        self.assertEqual(alerte.nb_signalements, 2)

        # 3ème signalement concordant à 70 mètres -> Seuil atteint
        sig3 = SignalementAccident.objects.create(
            latitude=36.8004,
            longitude=10.1801,
            adresse='Avenue Bourguiba Théâtre',
            gravite_estimee='GRAVE'
        )
        alerte = traiter_signalement(sig3)
        self.assertEqual(alerte.statut, 'CONFIRME')
        self.assertEqual(alerte.nb_signalements, 3)
        self.assertIsNotNone(alerte.date_confirmation)

        # Vérifier que l'audit a bien consigné l'action
        audit = JournalAudit.objects.filter(alerte=alerte).last()
        self.assertIn('QUALIFIÉE & CONFIRMÉE', audit.action)

    def test_workflow_intervention_horodatage_strict(self):
        """
        Vérifie la machine d'état en 4 étapes :
        Reçue -> Prise en charge -> En intervention -> Clôturée
        avec enregistrement strict des timestamps.
        """
        alerte = AlerteAccident.objects.create(
            latitude=36.8123,
            longitude=10.1784,
            adresse='Bab El Khadra',
            statut='CONFIRME'
        )

        # Étape 1 : Prise en charge
        res1 = self.client.post(f'/api/urgences/alerte/{alerte.id}/statut/', {'statut': 'PRISE_EN_CHARGE'}, format='json')
        self.assertEqual(res1.status_code, 200)
        alerte.refresh_from_db()
        self.assertEqual(alerte.statut, 'PRISE_EN_CHARGE')
        self.assertIsNotNone(alerte.date_prise_en_charge)

        # Étape 2 : En intervention
        res2 = self.client.post(f'/api/urgences/alerte/{alerte.id}/statut/', {'statut': 'EN_INTERVENTION'}, format='json')
        self.assertEqual(res2.status_code, 200)
        alerte.refresh_from_db()
        self.assertEqual(alerte.statut, 'EN_INTERVENTION')
        self.assertIsNotNone(alerte.date_en_intervention)

        # Étape 3 : Clôture
        res3 = self.client.post(f'/api/urgences/alerte/{alerte.id}/statut/', {'statut': 'CLOTURE'}, format='json')
        self.assertEqual(res3.status_code, 200)
        alerte.refresh_from_db()
        self.assertEqual(alerte.statut, 'CLOTURE')
        self.assertIsNotNone(alerte.date_cloture)

    # =========================================================================
    # 3. Tests Priorité 3 : Machine Learning Risk Map
    # =========================================================================
    def test_moteur_risk_map_evaluation(self):
        """Vérifie le calcul du score (0 à 100%), le code couleur et les facteurs explicatifs."""
        # Zone à risque élevé : trafic saturé (4.8), travaux, pluie, carrefour complexe, incidents lourds
        resultat = prediger_risque_zone(
            trafic_index=4.8,
            presence_travaux=1,
            meteo_pluie=1,
            incidents_recents=7,
            complexite_geometrique=3
        )
        self.assertGreaterEqual(resultat['score_risque_pourcentage'], 68.0)
        self.assertEqual(resultat['niveau_risk_map'], 'ROUGE')
        self.assertTrue(len(resultat['facteurs_explicatifs']) >= 3)

        # Zone à risque faible : trafic fluide, pas de travaux ni pluie
        resultat_faible = prediger_risque_zone(
            trafic_index=1.2,
            presence_travaux=0,
            meteo_pluie=0,
            incidents_recents=0,
            complexite_geometrique=0
        )
        self.assertLess(resultat_faible['score_risque_pourcentage'], 40.0)
        self.assertEqual(resultat_faible['niveau_risk_map'], 'VERT')

    def test_lister_zones_risk_map_api(self):
        """Vérifie le catalogue des secteurs du Grand Tunis avec géométries."""
        response = self.client.get('/api/urgences/risk-map/zones/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data) >= 8)
        self.assertIn('points_polygone', response.data[0])

    # =========================================================================
    # 4. Tests Priorité 3 : IA Générative / Module API Assistant LLM
    # =========================================================================
    def test_assistant_llm_reponse_factuelle_rag(self):
        """Vérifie que l'assistant LLM répond strictement à partir des données calculées sans invention."""
        question = "Pourquoi la zone Échangeur Bab Alioua est-elle risquée ?"
        response = self.client.post('/api/urgences/assistant-llm/', {'question': question}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('reponse', response.data)
        self.assertIn('sources_donnees_reelles', response.data)

        # Vérifier que la réponse cite les données exactes
        rep = response.data['reponse']
        self.assertIn('Bab Alioua', rep)
        self.assertIn('Score de risque', rep)

        # Vérifier l'enregistrement dans la table d'audit des requêtes LLM
        req_audit = RequeteAssistantLLM.objects.filter(question=question).first()
        self.assertIsNotNone(req_audit)
