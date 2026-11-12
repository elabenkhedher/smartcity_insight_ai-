from django.contrib import admin
from .models import Signalement, ProfilUtilisateur


@admin.register(ProfilUtilisateur)
class ProfilUtilisateurAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'date_creation', 'date_mise_a_jour')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')


@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'categorie',
        'gravite',
        'quartier',
        'statut',
        'auteur',
        'visages_plaques_floutes',
        'nb_zones_floutees',
        'date_creation',
    )
    list_filter = ('categorie', 'gravite', 'statut', 'visages_plaques_floutes', 'quartier')
    search_fields = ('description', 'adresse_texte', 'quartier', 'ip_emetteur', 'auteur__username')
    readonly_fields = ('id', 'date_creation', 'date_mise_a_jour')
    ordering = ('-date_creation',)
