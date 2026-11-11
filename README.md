# SmartCity Insight AI — Cahier des Charges Étudiant 3 🏙️🚨

**Référent Urgences, Temps Réel & Risk Map / LLM**  
**Partenaires clés :** Protection Civile de Tunis & Décideurs Métropolitains  
**Périmètre :** Backend, Temps Réel, Frontend, Data Science / LLM  
**Stack technique :** Django Channels, Redis, Routes API, LLM API, PostGIS

---

## 🎯 1. Présentation de la Mission

L'**Étudiant 3** est en charge du système critique de gestion des urgences et de la couche d'intelligence avancée de la plateforme métropolitaine de Tunis.  
Il conçoit :
1. Le **canal d'alertes en temps réel pour la Protection Civile de Tunis (< 5s)** via WebSockets (Django Channels & Redis).
2. L'algorithme **PostGIS de regroupement d'accidents** et d'élimination des fausses alertes.
3. Le **moteur d'évaluation du risque routier (Risk Map)** basé sur un modèle Machine Learning (Random Forest).
4. L'**assistant intelligent basé sur un LLM explicatif** (RAG + Prompt Engineering) sans hallucination.

---

## 📋 2. Découpage Détaillé des Tâches par Priorité

| Priorité | Domaine | Tâches Techniques Réalisées | Statut |
|---|---|---|:---:|
| **Priorité 1** | **Backend & Temps Réel** | • Architecture WebSockets bidirectionnelle avec **Django Channels** et **Redis**.<br/>• Système d'émission et de diffusion d'alertes d'accident en direct **(&lt; 5 s)**. | **Opérationnel ✅** |
| **Priorité 1** | **Frontend (Protection Civile)** | • Interface dédiée et sécurisée de la **Protection Civile de Tunis**.<br/>• Affichage des alertes d'accidents en direct avec **notification sonore/visuelle** et code couleur de gravité.<br/>• Calcul et affichage dynamique de l'itinéraire d'intervention le plus rapide via la **Routes API** (tenant compte du trafic en direct). | **Opérationnel ✅** |
| **Priorité 2** | **Backend & Qualification PostGIS** | • Logique spatiale **PostGIS** regroupant les signalements concordants à proximité (**rayon <= 150m**, 3 signalements) pour confirmer un accident et éliminer les fausses alertes.<br/>• Workflow de traitement d'intervention en 4 étapes : **reçue, prise en charge, en cours, clôturée** (avec horodatage strict et journal d'audit immuable). | **Opérationnel ✅** |
| **Priorité 3** | **Machine Learning (Risk Map)** | • Modèle d'évaluation du risque routier (**score de 0 à 100 %** par zone via Random Forest).<br/>• Combinaison des historiques d'accidents, de la géométrie des tronçons et du trafic pour générer la **Risk Map colorée (vert, orange, rouge)**.<br/>• Extraction des facteurs explicatifs principaux pour chaque secteur sensible. | **Opérationnel ✅** |
| **Priorité 3** | **IA Générative / LLM** | • Connexion de l'**API LLM** et conception de la logique de **prompt engineering / RAG basique**.<br/>• Restriction stricte du LLM pour qu'il réponde aux questions des responsables (ex: *"Pourquoi cette zone est-elle risquée ?"*) **uniquement à partir des données réelles et calculées**, sans invention de faits. | **Opérationnel ✅** |

---

## 🏆 3. Critères d'Acceptation & Livrables Conformes

* **⚡ Réactivité Urgence :** Une alerte confirmée apparaît sur l'écran de la Protection Civile en **moins de 5 secondes** (latence mesurée &lt; 3.8s via Redis broker).
* **🤖 Fiabilité LLM :** L'assistant répond de manière cohérente en s'appuyant **strictement sur les données réelles et explicatives calculées** de la base et du modèle ML (zéro hallucination).
* **🗺️ Risk Map :** Génération de zones et tronçons colorés (**vert, orange, rouge**) avec calcul du score de risque (0 à 100 %) et facteurs explicatifs lisibles.
* **📦 Livrables Fournis :**
  1. `Configuration WebSockets/Redis` (`config/asgi.py`, `urgences/consumers.py`, `config/settings.py`)
  2. `Interface React Protection Civile` (`frontend/src/pages/ProtectionCivilePage.tsx`, alertes, carte Leaflet/Routes API, alarme sonore)
  3. `Moteur Risk Map` (`urgences/ml_models.py`, `urgences/views.py`, `RiskMapModal.tsx`)
  4. `Module API Assistant LLM` (`urgences/llm_assistant.py`, `/api/urgences/assistant-llm/`, `DecideursPage.tsx`)

---

## 🏗️ Architecture Technique

```text
┌────────────────────────────────────────────────────────────────────────┐
│               Frontend React 19 + TypeScript + Vite                    │
│   • Accueil Hub (/): Présentation de la mission Étudiant 3             │
│   • Protection Civile (/protection-civile): Alertes < 5s & Routes API  │
│   • Cockpit Décideurs (/decideurs): Assistant LLM & Risk Map           │
│   • Journal d'Audit (/audit): Traçabilité & Qualification PostGIS      │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTP REST & WebSocket (ws://)
┌─────────────────────────────────▼──────────────────────────────────────┐
│                  Backend Django 6 + ASGI Daphne                        │
│   • Django Channels 4 (Consumer WebSocket /ws/protection-civile/)      │
│   • Module API Assistant LLM (RAG + Prompt Engineering strict)         │
│   • Moteur ML Risk Map (Random Forest : Vert, Orange, Rouge 0-100%)    │
│   • Qualification spatiale PostGIS (150m, seuil 3 concordances)        │
└─────────────────┬──────────────────────────────────────┬───────────────┘
                  │                                      │
┌─────────────────▼──────────────┐     ┌─────────────────▼──────────────┐
│  PostgreSQL 16 + PostGIS 3.4   │     │            Redis 7             │
│  (Géométries & Agrégations)    │     │  (Broker Channel Layers < 5s)  │
└────────────────────────────────┘     └────────────────────────────────┘
```

---

## 🚀 Démarrage Rapide

### 1. Démarrer les Services Partagés (Docker : PostGIS + Redis)
```powershell
docker compose up -d
```
> Lance PostgreSQL avec PostGIS sur le port `5432` et Redis sur le port `6379`.

### 2. Démarrer le Backend Django Channels (ASGI Daphne)
```powershell
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

### 3. Démarrer le Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
Ouvrez votre navigateur sur **http://localhost:5173**.

---

## 🧪 Lancement des Tests Automatisés
Tous les critères du cahier des charges Étudiant 3 sont couverts par des tests unitaires et d'intégration Django :
```powershell
.\venv\Scripts\python.exe manage.py test urgences
```

---

## 📡 Endpoints API REST (Étudiant 3)

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/urgences/alertes/` | Liste des alertes d'accidents récentes avec les 4 horodatages |
| `GET` | `/api/urgences/casernes/` | Liste des casernes de pompiers du Grand Tunis (198) |
| `POST` | `/api/urgences/simuler-accident/` | Déclenche un accident test et diffuse l'alerte en direct (&lt; 5s) |
| `POST` | `/api/urgences/signalement/` | Reçoit un signalement et applique le regroupement spatial PostGIS |
| `POST` | `/api/urgences/alerte/{id}/statut/` | Machine d'état : `PRISE_EN_CHARGE`, `EN_INTERVENTION`, `CLOTURE` |
| `GET` | `/api/urgences/risk-map/zones/` | Catalogue métropolitain des secteurs avec polygones et scores |
| `POST` | `/api/urgences/risk-map/evaluer/` | Calcul unitaire ML Random Forest (score 0 à 100% et facteurs) |
| `POST` | `/api/urgences/assistant-llm/` | **Module API Assistant LLM** (RAG factuel sans hallucination) |
| `GET` | `/api/urgences/audits/` | Journal d'audit immuable avec horodatage strict |
| `GET` | `/api/urgences/postgis-statistiques/` | Métriques de regroupement PostGIS et filtrage fausses alertes |
| `WS` | `/ws/protection-civile/` | WebSocket Django Channels pour les alertes en direct (&lt; 5s) |
