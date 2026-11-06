from django.contrib import admin
from django.urls import path
from urgences.views import creer_signalement, changer_statut_intervention

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/urgences/signalement/', creer_signalement),
    path('api/urgences/alerte/<int:alerte_id>/statut/', changer_statut_intervention),
]