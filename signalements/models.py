import uuid
from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserRole(models.TextChoices):
    CITOYEN = 'CITOYEN', 'Citoyen'
    RESPONSABLE_MUNICIPAL = 'RESPONSABLE_MUNICIPAL', 'Responsable Municipal'


class ProfilUtilisateur(models.Model):
    """
    Extension du modèle utilisateur Django pour la gestion des rôles
    (Citoyen vs Responsable Municipal).
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profil'
    )
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.CITOYEN,
        db_index=True
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Profil Utilisateur'
        verbose_name_plural = 'Profils Utilisateurs'

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"

    @property
    def est_responsable_municipal(self) -> bool:
        return self.role == UserRole.RESPONSABLE_MUNICIPAL


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def creer_profil_utilisateur(sender, instance, created, **kwargs):
    """Crée automatiquement un ProfilUtilisateur à la création d'un User Django."""
    if created:
        role_initial = (
            UserRole.RESPONSABLE_MUNICIPAL
            if instance.is_superuser
            else UserRole.CITOYEN
        )
        ProfilUtilisateur.objects.get_or_create(
            user=instance,
            defaults={'role': role_initial}
        )


def is_responsable_municipal(user) -> bool:
    """
    Vérifie si l'utilisateur possède les droits de Responsable Municipal
    via son ProfilUtilisateur, son groupe Django ou son statut superuser.
    """
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    try:
        if user.profil.role == UserRole.RESPONSABLE_MUNICIPAL:
            return True
    except ProfilUtilisateur.DoesNotExist:
        pass
    return user.groups.filter(name=UserRole.RESPONSABLE_MUNICIPAL).exists()


class Signalement(models.Model):
    class Categorie(models.TextChoices):
        ACCIDENT = 'ACCIDENT', 'Accident'
        NID_DE_POULE = 'NID_DE_POULE', 'Nid-de-poule'
        ECLAIRAGE = 'ECLAIRAGE', 'Éclairage public'
        DECHETS = 'DECHETS', 'Déchets / Voirie'
        SIGNALISATION = 'SIGNALISATION', 'Signalisation défaillante'
        AUTRE = 'AUTRE', 'Autre'

    class Gravite(models.TextChoices):
        FAIBLE = 'FAIBLE', 'Faible'
        MOYENNE = 'MOYENNE', 'Moyenne'
        ELEVEE = 'ELEVEE', 'Élevée'
        CRITIQUE = 'CRITIQUE', 'Critique'

    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        CONFIRME = 'CONFIRME', 'Confirmé'
        EN_COURS = 'EN_COURS', 'En cours de traitement'
        RESOLU = 'RESOLU', 'Résolu'
        REJETE_SPAM = 'REJETE_SPAM', 'Rejeté / Spam'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='signalements'
    )
    categorie = models.CharField(
        max_length=50,
        choices=Categorie.choices,
        db_index=True
    )
    gravite = models.CharField(
        max_length=20,
        choices=Gravite.choices,
        default=Gravite.MOYENNE,
        db_index=True
    )
    description = models.TextField(max_length=1000, blank=True)
    latitude = models.FloatField(db_index=True)
    longitude = models.FloatField(db_index=True)
    adresse_texte = models.CharField(max_length=255, blank=True)
    quartier = models.CharField(max_length=120, default='Centre-Ville Tunis', db_index=True)
    photo_floutee = models.ImageField(upload_to='signalements/anonymized/', null=True, blank=True)
    visages_plaques_floutes = models.BooleanField(default=False)
    nb_zones_floutees = models.IntegerField(default=0)
    statut = models.CharField(
        max_length=30,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
        db_index=True
    )
    ip_emetteur = models.GenericIPAddressField(null=True, blank=True, db_index=True)
    date_creation = models.DateTimeField(auto_now_add=True, db_index=True)
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Signalement'
        verbose_name_plural = 'Signalements'
        ordering = ['-date_creation']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._initial_photo = self.photo_floutee.name if self.photo_floutee else None

    def save(self, *args, **kwargs):
        # Anonymisation automatique (INPDP) lors du téléversement d'une photo brute
        update_fields = kwargs.get('update_fields')
        should_check_photo = update_fields is None or 'photo_floutee' in update_fields
        photo_presente = bool(self.photo_floutee and hasattr(self.photo_floutee, 'file'))
        photo_modifiee = bool(self.photo_floutee and (self.photo_floutee.name != getattr(self, '_initial_photo', None)))

        if should_check_photo and photo_presente and (not self.visages_plaques_floutes or photo_modifiee):
            from .privacy_blur import anonymize_image
            processed_file, count, success = anonymize_image(self.photo_floutee)
            if success and processed_file:
                self.photo_floutee = processed_file
                self.visages_plaques_floutes = True
                self.nb_zones_floutees = count

        super().save(*args, **kwargs)
        self._initial_photo = self.photo_floutee.name if self.photo_floutee else None

    def __str__(self):
        return f"Signalement {self.categorie} - {self.quartier} ({self.statut})"
