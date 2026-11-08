from django.contrib import admin
from django.urls import path
from urgences.views import (
    creer_signalement,
    changer_statut_intervention,
    calculer_risk_map_zone,
    lister_alertes,
    lister_casernes,
    simuler_accident,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/urgences/alertes/', lister_alertes, name='lister_alertes'),
    path('api/urgences/casernes/', lister_casernes, name='lister_casernes'),
    path('api/urgences/simuler-accident/', simuler_accident, name='simuler_accident'),
    # Passerelle d'interconnexion pour le module Signalements Citoyens (Étudiant 2)
    path('api/urgences/signalement/', creer_signalement, name='creer_signalement'),
    path('api/urgences/recevoir-accident/', creer_signalement, name='recevoir_accident_etud2'),
    path('api/urgences/alerte/<int:alerte_id>/statut/', changer_statut_intervention, name='changer_statut_intervention'),
    path('api/urgences/risk-map/', calculer_risk_map_zone, name='calculer_risk_map_zone'),
]
