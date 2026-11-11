from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class SignalementAccident(models.Model):
    """
    Signalement d'accident géolocalisé transmis au système.
    Utilisé par la qualification spatiale PostGIS pour regrouper les signalements concordants.
    """
    GRAVITE_CHOICES = [('FAIBLE', 'Faible'), ('MOYENNE', 'Moyenne'), ('GRAVE', 'Grave')]

    latitude = models.FloatField()
    longitude = models.FloatField()
    adresse = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    gravite_estimee = models.CharField(max_length=20, choices=GRAVITE_CHOICES, default='MOYENNE')
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Signalement ({self.latitude}, {self.longitude}) - {self.gravite_estimee}"


class AlerteAccident(models.Model):
    """
    Alerte d'accident qualifiée par regroupement PostGIS ou confirmation opérationnelle.
    Workflow strict exigé par le cahier des charges :
    Reçue (CONFIRME) -> Prise en charge -> En cours -> Clôturée
    avec horodatage strict et diffusion temps réel (< 5s) via WebSockets/Redis.
    """
    STATUT_CHOICES = [
        ('A_CONFIRMER', 'À confirmer (En attente de signalements concordants)'),
        ('CONFIRME', 'Reçue / Confirmée'),
        ('PRISE_EN_CHARGE', 'Prise en charge'),
        ('EN_INTERVENTION', 'En cours (En intervention)'),
        ('CLOTURE', 'Clôturée'),
    ]

    latitude = models.FloatField()
    longitude = models.FloatField()
    adresse = models.CharField(max_length=255, blank=True)
    gravite = models.CharField(max_length=20, default='MOYENNE')
    statut = models.CharField(max_length=25, choices=STATUT_CHOICES, default='A_CONFIRMER')
    nb_signalements = models.PositiveIntegerField(default=1)
    signalements_lies = models.ManyToManyField(SignalementAccident, related_name='alertes')

    # Horodatage strict de chaque étape du workflow
    date_creation = models.DateTimeField(auto_now_add=True)
    date_confirmation = models.DateTimeField(null=True, blank=True)
    date_prise_en_charge = models.DateTimeField(null=True, blank=True)
    date_en_intervention = models.DateTimeField(null=True, blank=True)
    date_cloture = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Alerte #{self.id} - {self.statut} ({self.nb_signalements} sig.)"


class JournalAudit(models.Model):
    """
    Journal d'audit immuable avec horodatage strict pour chaque action
    et changement d'état d'intervention.
    """
    alerte = models.ForeignKey(AlerteAccident, on_delete=models.CASCADE, related_name='audits', null=True, blank=True)
    utilisateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True, default='')
    niveau = models.CharField(max_length=20, default='INFO')  # INFO, AVERTISSEMENT, CRITIQUE
    horodatage = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.horodatage}] {self.action}"


class ZoneRisque(models.Model):
    """
    Zone métropolitaine évaluée par le modèle Machine Learning (Risk Map).
    Score de risque de 0 à 100%, combinant historique d'accidents,
    géométrie des tronçons et trafic pour générer la Risk Map colorée (vert, orange, rouge).
    """
    NIVEAU_CHOICES = [
        ('VERT', 'Faible (Vert)'),
        ('ORANGE', 'Modéré / Vigilance (Orange)'),
        ('ROUGE', 'Élevé / Critique (Rouge)'),
    ]

    nom = models.CharField(max_length=255)
    arrondissement = models.CharField(max_length=255, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    rayon_metres = models.IntegerField(default=450)
    geometrie_type = models.CharField(max_length=50, default='POINT_RAYON')
    coordonnees_polygone = models.TextField(blank=True, default='[]')

    # Facteurs d'entrée du modèle ML
    trafic_index = models.FloatField(default=2.5)  # 1.0 à 5.0
    presence_travaux = models.BooleanField(default=False)
    meteo_pluie = models.BooleanField(default=False)
    incidents_recents = models.IntegerField(default=1)

    # Sorties calculées par Machine Learning
    score_risque = models.FloatField(default=35.0)  # 0 à 100%
    niveau_risque = models.CharField(max_length=20, choices=NIVEAU_CHOICES, default='VERT')
    facteurs_explicatifs = models.TextField(default='[]')  # JSON array
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nom} - {self.score_risque}% ({self.niveau_risque})"


class RequeteAssistantLLM(models.Model):
    """
    Traçabilité des requêtes et réponses de l'Assistant LLM Décideurs.
    Permet de vérifier le respect des critères de non-invention de faits
    et d'ancrage strict sur les données réelles et calculées.
    """
    question = models.TextField()
    reponse = models.TextField()
    contexte_utilise = models.TextField(default='[]')
    sources_donnees = models.TextField(default='[]')
    horodatage = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.horodatage}] LLM: {self.question[:40]}..."
