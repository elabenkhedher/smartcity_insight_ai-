from django.utils import timezone
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import SignalementAccident, AlerteAccident, JournalAudit
from .services import traiter_signalement, diffuser_alerte_temps_reel

@api_view(['POST'])
def creer_signalement(request):
    """Endpoint Citoyen / Agent pour déclarer un accident"""
    sig = SignalementAccident.objects.create(
        latitude=float(request.data.get('latitude', 36.8065)),
        longitude=float(request.data.get('longitude', 10.1815)),
        adresse=request.data.get('adresse', 'Avenue Habib Bourguiba, Tunis'),
        description=request.data.get('description', ''),
        gravite_estimee=request.data.get('gravite', 'GRAVE')
    )
    valide_par_agent = bool(request.data.get('valide_par_agent', False))
    alerte = traiter_signalement(sig, valide_par_agent=valide_par_agent)

    return Response({
        "message": "Signalement enregistré",
        "alerte_id": alerte.id,
        "statut_alerte": alerte.statut,
        "nb_signalements_concordants": alerte.nb_signalements
    })

@api_view(['POST'])
def changer_statut_intervention(request, alerte_id):
    """Workflow Protection Civile : PRISE_EN_CHARGE -> EN_INTERVENTION -> CLOTURE"""
    alerte = AlerteAccident.objects.get(id=alerte_id)
    nouveau_statut = request.data.get('statut')
    now = timezone.now()

    alerte.statut = nouveau_statut
    if nouveau_statut == 'PRISE_EN_CHARGE':
        alerte.date_prise_en_charge = now
    elif nouveau_statut == 'EN_INTERVENTION':
        alerte.date_en_intervention = now
    elif nouveau_statut == 'CLOTURE':
        alerte.date_cloture = now
    alerte.save()

    JournalAudit.objects.create(
        alerte=alerte,
        action=f"Changement de statut vers {nouveau_statut}"
    )
    diffuser_alerte_temps_reel(alerte)
    return Response({"alerte_id": alerte.id, "nouveau_statut": alerte.statut, "horodatage": now})