import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ProtectionCivileConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "protection_civile_tunis"
        # Connecter l'écran de la Protection Civile au canal temps réel
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        # Message de bienvenue pour confirmer que le WebSocket est bien branché !
        await self.send(text_data=json.dumps({
            "event": "CONNEXION_ETABLIE",
            "message": "Connecté au canal d'urgence de la Protection Civile de Tunis (< 5s)"
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Appelé automatiquement dès qu'un accident est confirmé
    async def envoyer_alerte(self, event):
        await self.send(text_data=json.dumps({
            "event": "NOUVELLE_ALERTE_ACCIDENT",
            "alerte": event["data"]
        }))