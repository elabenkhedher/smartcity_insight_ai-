"""
Authentification JWT (Bearer Token HS256) sans dépendance externe,
basée sur la SECRET_KEY Django pour le module Signalements & Responsable Municipal.
"""

import base64
import hashlib
import hmac
import json
import time
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions
from .models import UserRole, is_responsable_municipal

User = get_user_model()

JWT_DEFAULT_TTL_SECONDS = 60 * 60 * 12  # 12 heures


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def _b64url_decode(data: str) -> bytes:
    padding = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def get_user_role(user) -> str:
    """Retourne le rôle effectif d'un utilisateur (CITOYEN ou RESPONSABLE_MUNICIPAL)."""
    if is_responsable_municipal(user):
        return UserRole.RESPONSABLE_MUNICIPAL
    return UserRole.CITOYEN


def generate_jwt_token(user, ttl_seconds: int = JWT_DEFAULT_TTL_SECONDS) -> str:
    """Génère un JWT HS256 signé pour l'utilisateur donné."""
    now = int(time.time())
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {
        'user_id': user.pk,
        'username': user.username,
        'role': get_user_role(user),
        'est_responsable_municipal': is_responsable_municipal(user),
        'iat': now,
        'exp': now + ttl_seconds,
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    signing_input = f'{header_b64}.{payload_b64}'.encode('ascii')

    secret = settings.SECRET_KEY.encode('utf-8')
    signature = hmac.new(secret, signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f'{header_b64}.{payload_b64}.{signature_b64}'


def decode_jwt_token(token: str) -> dict:
    """Vérifie la signature HS256 et l'expiration d'un JWT et retourne son payload."""
    parts = token.split('.')
    if len(parts) != 3:
        raise exceptions.AuthenticationFailed('Format de jeton Bearer JWT invalide.')

    header_b64, payload_b64, signature_b64 = parts
    signing_input = f'{header_b64}.{payload_b64}'.encode('ascii')

    secret = settings.SECRET_KEY.encode('utf-8')
    expected_sig = hmac.new(secret, signing_input, hashlib.sha256).digest()

    try:
        provided_sig = _b64url_decode(signature_b64)
    except Exception:
        raise exceptions.AuthenticationFailed('Signature JWT malformée.')

    if not hmac.compare_digest(expected_sig, provided_sig):
        raise exceptions.AuthenticationFailed('Signature JWT invalide.')

    try:
        payload = json.loads(_b64url_decode(payload_b64).decode('utf-8'))
    except Exception:
        raise exceptions.AuthenticationFailed('Contenu JWT illisible.')

    exp = payload.get('exp')
    if exp is None or int(time.time()) > int(exp):
        raise exceptions.AuthenticationFailed('Session expirée : veuillez vous reconnecter.')

    return payload


class BearerJWTAuthentication(authentication.BaseAuthentication):
    """
    Authentification DRF par en-tête HTTP `Authorization: Bearer <token>`.
    """
    keyword = 'Bearer'

    def authenticate_header(self, request):
        auth_header = authentication.get_authorization_header(request)
        if auth_header:
            return self.keyword
        return None

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode('utf-8')
        if not auth_header:
            return None

        parts = auth_header.split()
        if not parts or parts[0].lower() != self.keyword.lower():
            return None

        if len(parts) == 1:
            raise exceptions.AuthenticationFailed('En-tête Authorization Bearer incomplet.')
        if len(parts) > 2:
            raise exceptions.AuthenticationFailed('En-tête Authorization Bearer invalide.')

        token = parts[1]
        payload = decode_jwt_token(token)
        user_id = payload.get('user_id')
        if not user_id:
            raise exceptions.AuthenticationFailed('Jeton JWT sans identifiant utilisateur.')

        try:
            user = User.objects.get(pk=user_id, is_active=True)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('Utilisateur introuvable ou désactivé.')

        return (user, token)
