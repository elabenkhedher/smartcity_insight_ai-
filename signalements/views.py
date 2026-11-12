from django.contrib.auth import authenticate
from django.db.models import Count, Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from .authentication import generate_jwt_token, get_user_role
from .models import Signalement, is_responsable_municipal
from .permissions import IsCitoyenOrReadOnly, IsResponsableMunicipal
from .serializers import (
    ChangerStatutSerializer,
    SignalementResponsableSerializer,
    SignalementSerializer,
    get_client_ip,
)


class SignalementCreationRateThrottle(AnonRateThrottle):
    """
    Rate Limiting anti-spam : limite les créations anonymes de signalements
    à 5 requêtes par heure par adresse IP pour éviter les abus et attaques DDoS.
    """
    scope = 'signalements_create'
    rate = '5/hour'

    def get_cache_key(self, request, view):
        # Throttle basé sur l'identifiant / IP de l'émetteur
        ident = self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class SignalementViewSet(viewsets.ModelViewSet):
    """
    API ViewSet pour la consultation, le filtrage, la soumission et la supervision
    des signalements citoyens.

    Permissions par rôle :
      - Citoyen / Public : lecture publique (GET) et création (POST) de signalements.
      - Responsable Municipal : modification de statut (PATCH/PUT), suppression (DELETE),
        statistiques avancées (/statistiques/) et supervision globale (/supervision/).

    Filtres disponibles :
      - ?quartier=Centre-Ville Tunis
      - ?statut=EN_ATTENTE
      - ?categorie=NID_DE_POULE
    """
    queryset = Signalement.objects.all().order_by('-date_creation')
    serializer_class = SignalementSerializer
    permission_classes = [IsCitoyenOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    RESPONSABLE_ONLY_ACTIONS = {
        'update',
        'partial_update',
        'destroy',
        'changer_statut',
        'statistiques',
        'supervision',
    }

    def get_permissions(self):
        if self.action in self.RESPONSABLE_ONLY_ACTIONS:
            return [IsResponsableMunicipal()]
        return [IsCitoyenOrReadOnly()]

    def get_serializer_class(self):
        if self.action in ('update', 'partial_update'):
            return SignalementResponsableSerializer
        if self.action == 'changer_statut':
            return ChangerStatutSerializer
        return SignalementSerializer

    def get_throttles(self):
        # Applique le Rate Limiting strict uniquement sur la création de signalement (POST)
        if self.action == 'create':
            return [SignalementCreationRateThrottle()]
        return super().get_throttles()

    def perform_create(self, serializer):
        # Capture de l'IP émetteur et de l'auteur authentifié lors de la création
        client_ip = get_client_ip(self.request)
        auteur = (
            self.request.user
            if (self.request.user and self.request.user.is_authenticated)
            else None
        )
        serializer.save(ip_emetteur=client_ip, auteur=auteur)

    def get_queryset(self):
        queryset = super().get_queryset()
        quartier = self.request.query_params.get('quartier')
        statut = self.request.query_params.get('statut')
        categorie = self.request.query_params.get('categorie')

        if quartier:
            queryset = queryset.filter(quartier__icontains=quartier)
        if statut:
            queryset = queryset.filter(statut=statut)
        if categorie:
            queryset = queryset.filter(categorie=categorie)

        return queryset

    @action(
        detail=True,
        methods=['patch', 'post'],
        url_path='changer-statut',
        permission_classes=[IsResponsableMunicipal],
    )
    def changer_statut(self, request, pk=None):
        """
        Action réservée au Responsable Municipal pour faire évoluer le statut
        d'un signalement (EN_ATTENTE -> CONFIRME / EN_COURS / RESOLU / REJETE_SPAM).
        """
        signalement = self.get_object()
        serializer = ChangerStatutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        signalement.statut = serializer.validated_data['statut']
        signalement.save(update_fields=['statut', 'date_mise_a_jour'])
        return Response(
            SignalementResponsableSerializer(
                signalement,
                context={'request': request, 'view': self}
            ).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=['get'],
        url_path='statistiques',
        permission_classes=[IsResponsableMunicipal],
    )
    def statistiques(self, request):
        """
        Statistiques avancées et indicateurs de conformité INPDP réservés
        exclusivement au Responsable Municipal.
        """
        qs = Signalement.objects.all()
        total = qs.count()
        par_statut = dict(qs.values_list('statut').annotate(c=Count('id')))
        par_categorie = dict(qs.values_list('categorie').annotate(c=Count('id')))
        par_gravite = dict(qs.values_list('gravite').annotate(c=Count('id')))
        par_quartier = list(
            qs.values('quartier').annotate(total=Count('id')).order_by('-total')
        )
        photos_floutees = qs.filter(visages_plaques_floutes=True).count()
        total_zones_floutees = qs.aggregate(total=Sum('nb_zones_floutees'))['total'] or 0
        resolus = par_statut.get(Signalement.Statut.RESOLU, 0)
        taux_resolution = round((resolus / total) * 100, 2) if total > 0 else 0.0

        return Response(
            {
                'total_signalements': total,
                'par_statut': par_statut,
                'par_categorie': par_categorie,
                'par_gravite': par_gravite,
                'par_quartier': par_quartier,
                'conformite_inpdp': {
                    'photos_floutees': photos_floutees,
                    'total_zones_floutees': total_zones_floutees,
                },
                'taux_resolution_pourcent': taux_resolution,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=['get'],
        url_path='supervision',
        permission_classes=[IsResponsableMunicipal],
    )
    def supervision(self, request):
        """
        Rapport global de supervision municipale incluant les données sensibles
        (IP émettrice, auteur, détection spam) réservé au Responsable Municipal.
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = SignalementResponsableSerializer(
            queryset,
            many=True,
            context={'request': request, 'view': self},
        )
        return Response(
            {
                'total': queryset.count(),
                'signalements': serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class LoginSignalementView(APIView):
    """
    Endpoint d'authentification délivrant un jeton Bearer JWT signé HS256
    ainsi que le rôle de l'utilisateur (CITOYEN ou RESPONSABLE_MUNICIPAL).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''

        if not username or not password:
            return Response(
                {'detail': "Veuillez renseigner le nom d'utilisateur et le mot de passe."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {'detail': 'Identifiants invalides.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {'detail': 'Ce compte est désactivé.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        token = generate_jwt_token(user)
        return Response(
            {
                'access': token,
                'token_type': 'Bearer',
                'user': {
                    'id': user.pk,
                    'username': user.username,
                    'email': user.email,
                    'role': get_user_role(user),
                    'est_responsable_municipal': is_responsable_municipal(user),
                },
            },
            status=status.HTTP_200_OK,
        )


class CurrentUserProfileView(APIView):
    """Retourne les informations et le rôle de l'utilisateur authentifié."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                'id': user.pk,
                'username': user.username,
                'email': user.email,
                'role': get_user_role(user),
                'est_responsable_municipal': is_responsable_municipal(user),
            },
            status=status.HTTP_200_OK,
        )

