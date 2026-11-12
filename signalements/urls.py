from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CurrentUserProfileView,
    LoginSignalementView,
    SignalementViewSet,
)

router = DefaultRouter()
router.register(r'', SignalementViewSet, basename='signalement')

urlpatterns = [
    path('auth/login/', LoginSignalementView.as_view(), name='signalements_login'),
    path('auth/me/', CurrentUserProfileView.as_view(), name='signalements_me'),
    path('', include(router.urls)),
]
