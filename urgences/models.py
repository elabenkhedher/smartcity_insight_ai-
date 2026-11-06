from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class SignalementAccident(models.Model):
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
    STATUT_CHOICES = [
        ('A_CONFIRMER', 'À confirmer'),
        ('CONFIRME', 'Confirmé (Reçue)'),
        ('PRISE_EN_CHARGE', 'Prise en charge'),
        ('EN_INTERVENTION', 'En intervention'),
        ('CLOTURE', 'Clôturée'),
    ]

    latitude = models.FloatField()
    longitude = models.FloatField()
    adresse = models.CharField(max_length=255, blank=True)
    gravite = models.CharField(max_length=20, default='MOYENNE')
    statut = models.CharField(max_length=25, choices=STATUT_CHOICES, default='A_CONFIRMER')
    nb_signalements = models.PositiveIntegerField(default=1)
    signalements_lies = models.ManyToManyField(SignalementAccident, related_name='alertes')

    # Horodatage strict de chaque étape (exigé pour la Protection Civile)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_confirmation = models.DateTimeField(null=True, blank=True)
    date_prise_en_charge = models.DateTimeField(null=True, blank=True)
    date_en_intervention = models.DateTimeField(null=True, blank=True)
    date_cloture = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Alerte #{self.id} - {self.statut} ({self.nb_signalements} sig.)"


class JournalAudit(models.Model):
    alerte = models.ForeignKey(AlerteAccident, on_delete=models.CASCADE, related_name='audits')
    utilisateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    horodatage = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.horodatage}] Alerte #{self.alerte.id} : {self.action}"