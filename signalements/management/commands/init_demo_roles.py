from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from signalements.models import ProfilUtilisateur, UserRole

User = get_user_model()


class Command(BaseCommand):
    help = "Initialise des comptes de démonstration (Responsable Municipal et Citoyen)."

    def handle(self, *args, **options):
        # 1. Responsable Municipal
        resp_user, created_resp = User.objects.get_or_create(
            username='responsable_mairie',
            defaults={
                'email': 'responsable@tunis.gov.tn',
                'is_staff': True,
            },
        )
        resp_user.set_password('Mairie2026!')
        resp_user.save()
        ProfilUtilisateur.objects.update_or_create(
            user=resp_user,
            defaults={'role': UserRole.RESPONSABLE_MUNICIPAL},
        )

        # 2. Citoyen simple (pour tester le blocage 403)
        cit_user, created_cit = User.objects.get_or_create(
            username='citoyen_demo',
            defaults={
                'email': 'citoyen@tunis.tn',
            },
        )
        cit_user.set_password('Citoyen2026!')
        cit_user.save()
        ProfilUtilisateur.objects.update_or_create(
            user=cit_user,
            defaults={'role': UserRole.CITOYEN},
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Comptes initialisés : responsable_mairie (RESPONSABLE_MUNICIPAL) "
                "et citoyen_demo (CITOYEN)."
            )
        )
