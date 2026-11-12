from rest_framework import permissions
from .models import is_responsable_municipal


class IsResponsableMunicipal(permissions.BasePermission):
    """
    Permission DRF réservant l'accès exclusivement au Responsable Municipal :
    - Supervision globale des signalements
    - Statistiques avancées et indicateurs INPDP
    - Changement de statut, modification et suppression de signalements
    """
    message = (
        "Accès refusé : cette action est réservée exclusivement au Responsable Municipal."
    )

    def has_permission(self, request, view):
        return is_responsable_municipal(request.user)

    def has_object_permission(self, request, view, obj):
        return is_responsable_municipal(request.user)


class IsCitoyenOrReadOnly(permissions.BasePermission):
    """
    Permission DRF pour les signalements citoyens :
    - Autorise la lecture seule (GET, HEAD, OPTIONS) sur la liste/détail publics
      et le dépôt d'un nouveau signalement (POST) par les citoyens.
    - Bloque toute modification de statut (PUT, PATCH), suppression (DELETE) ou
      accès aux endpoints réservés (statistiques, supervision) pour les non-responsables.
    """
    message = (
        "Accès refusé : seuls les responsables municipaux peuvent modifier les statuts "
        "ou accéder aux rapports globaux."
    )

    RESTRICTED_ACTIONS = {
        'update',
        'partial_update',
        'destroy',
        'changer_statut',
        'statistiques',
        'supervision',
    }

    def has_permission(self, request, view):
        action = getattr(view, 'action', None)

        # Les actions d'administration/supervision exigent toujours le rôle Responsable Municipal
        if action in self.RESTRICTED_ACTIONS:
            return is_responsable_municipal(request.user)

        # Lecture seule autorisée
        if request.method in permissions.SAFE_METHODS:
            return True

        # Dépôt citoyen (POST /api/signalements/) autorisé
        if request.method == 'POST' and action in (None, 'create'):
            return True

        # Toute autre opération d'écriture réservée au Responsable Municipal
        return is_responsable_municipal(request.user)

    def has_object_permission(self, request, view, obj):
        action = getattr(view, 'action', None)
        if action in self.RESTRICTED_ACTIONS:
            return is_responsable_municipal(request.user)

        if request.method in permissions.SAFE_METHODS:
            return True

        return is_responsable_municipal(request.user)
