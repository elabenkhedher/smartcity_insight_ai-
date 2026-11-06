import math
from datetime import timedelta
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import SignalementAccident, AlerteAccident, JournalAudit

SEUIL_CONFIRMATION = 3
RAYON_PROXIMITE_METRES = 150

def distance_metres(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def traiter_signalement(signalement: SignalementAccident, valide_par_agent=False):
    fenetre_temps = timezone.now() - timedelta(minutes=30)
    alertes_actives = AlerteAccident.objects.filter(
        date_creation__gte=fenetre_temps
    ).exclude(statut='CLOTURE')

    alerte_proche = None
    for alerte in alertes_actives:
        if distance_metres(signalement.latitude, signalement.longitude, alerte.latitude, alerte.longitude) <= RAYON_PROXIMITE_METRES:
            alerte_proche = alerte
            break

    if alerte_proche:
        alerte_proche.signalements_lies.add(signalement)
        alerte_proche.nb_signalements = alerte_proche.signalements_lies.count()
    else:
        alerte_proche = AlerteAccident.objects.create(
            latitude=signalement.latitude,
            longitude=signalement.longitude,
            adresse=signalement.adresse,
            gravite=signalement.gravite_estimee,
            nb_signalements=1
        )
        alerte_proche.signalements_lies.add(signalement)

    if alerte_proche.statut == 'A_CONFIRMER' and (
        alerte_proche.nb_signalements >= SEUIL_CONFIRMATION or valide_par_agent
    ):
        alerte_proche.statut = 'CONFIRME'
        alerte_proche.date_confirmation = timezone.now()
        alerte_proche.save()

        JournalAudit.objects.create(
            alerte=alerte_proche,
            action=f"Alerte CONFIRMEE ({alerte_proche.nb_signalements} signalements)"
        )
        diffuser_alerte_temps_reel(alerte_proche)
    else:
        alerte_proche.save()

    return alerte_proche

def diffuser_alerte_temps_reel(alerte: AlerteAccident):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "protection_civile_tunis",
        {
            "type": "envoyer_alerte",
            "data": {
                "id": alerte.id,
                "statut": alerte.statut,
                "gravite": alerte.gravite,
                "adresse": alerte.adresse,
                "latitude": alerte.latitude,
                "longitude": alerte.longitude,
                "nb_signalements": alerte.nb_signalements,
                "date_confirmation": alerte.date_confirmation.isoformat() if alerte.date_confirmation else None,
            }
        }
    )