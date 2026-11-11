from django.contrib import admin
from django.urls import path
from urgences.views import (
    lister_alertes,
    lister_casernes,
    simuler_accident,
    creer_signalement,
    changer_statut_intervention,
    calculer_risk_map_zone,
    lister_zones_risk_map,
    endpoint_assistant_llm,
    lister_audits,
    statistiques_postgis,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Priorité 1 : Urgences Temps Réel & WebSockets (< 5s)
    path('api/urgences/alertes/', lister_alertes, name='lister_alertes'),
    path('api/urgences/casernes/', lister_casernes, name='lister_casernes'),
    path('api/urgences/simuler-accident/', simuler_accident, name='simuler_accident'),

    # Priorité 2 : Qualification PostGIS & Workflow d'Intervention (Reçue -> Prise en charge -> En cours -> Clôturée)
    path('api/urgences/signalement/', creer_signalement, name='creer_signalement'),
    path('api/urgences/alerte/<int:alerte_id>/statut/', changer_statut_intervention, name='changer_statut_intervention'),
    path('api/urgences/audits/', lister_audits, name='lister_audits'),
    path('api/urgences/postgis-statistiques/', statistiques_postgis, name='statistiques_postgis'),

    # Priorité 3 : Machine Learning Risk Map (Vert, Orange, Rouge 0-100%)
    path('api/urgences/risk-map/', calculer_risk_map_zone, name='calculer_risk_map_zone'),
    path('api/urgences/risk-map/evaluer/', calculer_risk_map_zone, name='evaluer_risk_map'),
    path('api/urgences/risk-map/zones/', lister_zones_risk_map, name='lister_zones_risk_map'),

    # Priorité 3 : IA Générative / LLM (Prompt Engineering & RAG ancré sur les données réelles)
    path('api/urgences/assistant-llm/', endpoint_assistant_llm, name='endpoint_assistant_llm'),
]
