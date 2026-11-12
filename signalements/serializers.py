from rest_framework import serializers
from .models import Signalement, is_responsable_municipal


def get_client_ip(request):
    """Extrait l'adresse IP cliente depuis la requête HTTP (gère d'éventuels proxys)."""
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class SignalementSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la consultation et la création de signalements citoyens.
    Enregistre automatiquement l'IP émetteur et l'auteur, et protège les champs
    sensibles/calculés (comme le statut) en lecture seule.
    """
    class Meta:
        model = Signalement
        fields = [
            'id',
            'auteur',
            'categorie',
            'gravite',
            'description',
            'latitude',
            'longitude',
            'adresse_texte',
            'quartier',
            'photo_floutee',
            'visages_plaques_floutes',
            'nb_zones_floutees',
            'statut',
            'ip_emetteur',
            'date_creation',
            'date_mise_a_jour',
        ]
        read_only_fields = [
            'id',
            'auteur',
            'visages_plaques_floutes',
            'nb_zones_floutees',
            'statut',
            'ip_emetteur',
            'date_creation',
            'date_mise_a_jour',
        ]

    def create(self, validated_data):
        # Récupération automatique de l'IP cliente et de l'auteur authentifié lors de la création
        request = self.context.get('request')
        if request:
            if not validated_data.get('ip_emetteur'):
                validated_data['ip_emetteur'] = get_client_ip(request)
            if request.user and request.user.is_authenticated and not validated_data.get('auteur'):
                validated_data['auteur'] = request.user
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        view = self.context.get('view')
        action = getattr(view, 'action', None)
        # Conformité INPDP : masquer les identifiants sensibles (IP, auteur) en lecture publique
        # pour les citoyens ou visiteurs anonymes ; seul le Responsable Municipal y accède.
        if request and action in ('list', 'retrieve') and not is_responsable_municipal(request.user):
            data.pop('ip_emetteur', None)
            data.pop('auteur', None)
        return data


class SignalementResponsableSerializer(SignalementSerializer):
    """
    Sérialiseur réservé au Responsable Municipal permettant la modification
    du statut d'intervention et l'accès complet aux champs de supervision.
    """
    class Meta(SignalementSerializer.Meta):
        read_only_fields = [
            'id',
            'auteur',
            'visages_plaques_floutes',
            'nb_zones_floutees',
            'ip_emetteur',
            'date_creation',
            'date_mise_a_jour',
        ]


class ChangerStatutSerializer(serializers.Serializer):
    """Sérialiseur dédié à la validation du changement de statut par le Responsable Municipal."""
    statut = serializers.ChoiceField(choices=Signalement.Statut.choices)
