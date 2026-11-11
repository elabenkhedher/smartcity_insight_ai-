import { JournalAuditEntry } from '../types';

export const INITIAL_AUDIT_LOGS: JournalAuditEntry[] = [
  {
    id: 'AUD-8821',
    horodatage: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    utilisateur: 'Moteur Spatial PostGIS (ST_DWithin)',
    action: 'Regroupement spatial PostGIS : 3 signalements concordants dans un rayon de 142m',
    details: 'Alerte #104 confirmée automatiquement (Échangeur Bab Alioua). Seuil de qualification atteint, élimination fausse alerte validée.',
    niveau: 'CRITIQUE',
    alerte_id: 104,
  },
  {
    id: 'AUD-8820',
    horodatage: new Date(Date.now() - 2.8 * 60 * 1000).toISOString(),
    utilisateur: 'Daphne ASGI & Redis ChannelLayer',
    action: 'Diffusion WebSocket temps réel envoyée au groupe protection_civile_tunis (< 3.6s)',
    details: 'Trame JSON expédiée aux consoles connectées. Déclenchement de l’alarme sonore et visuelle CCO 198.',
    niveau: 'CRITIQUE',
    alerte_id: 104,
  },
  {
    id: 'AUD-8819',
    horodatage: new Date(Date.now() - 1.5 * 60 * 1000).toISOString(),
    utilisateur: 'Cdt. Youssef Ben Amor (CCO 198)',
    action: 'Workflow Intervention -> Passage au statut PRISE_EN_CHARGE',
    details: 'Attribution Caserne Centrale Bab El Khadra. Ambulance VSU-02 et FPT-01 engagés avec gyrophares.',
    niveau: 'INFO',
    alerte_id: 104,
  },
  {
    id: 'AUD-8818',
    horodatage: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    utilisateur: 'Module API Assistant LLM (RAG)',
    action: 'Requête Décideur traitée : "Pourquoi l’Échangeur Bab Alioua est-il en zone rouge ?"',
    details: 'Extraction factuelle sans hallucination : Score 92.0%, trafic 4.6/5, chantier actif, 8 incidents 30j.',
    niveau: 'INFO',
  },
  {
    id: 'AUD-8817',
    horodatage: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    utilisateur: 'Moteur Spatial PostGIS',
    action: 'Signalement isolé mis en observation (A_CONFIRMER)',
    details: 'Coordonnées (36.8142, 10.1824). En attente de concordances à moins de 150m pour éliminer les fausses alertes.',
    niveau: 'INFO',
    alerte_id: 103,
  },
  {
    id: 'AUD-8816',
    horodatage: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    utilisateur: 'Cdt. Youssef Ben Amor (CCO 198)',
    action: 'Workflow Intervention -> Passage au statut CLOTURE',
    details: 'Intervention sur Avenue Bourguiba terminée avec succès. 2 blessés légers évacués vers Hôpital Charles Nicolle.',
    niveau: 'CRITIQUE',
    alerte_id: 101,
  },
];

export const PRESET_QUESTIONS_LLM = [
  "Pourquoi l'Échangeur Bab Alioua est-il classé en zone rouge ?",
  "Quels facteurs expliquent le score de risque sur la Route X du Bardo ?",
  "Comment l'algorithme PostGIS élimine-t-il les fausses alertes d'accidents ?",
  "Quel est le temps moyen de diffusion des alertes vers la Protection Civile ?",
  "Quelles sont les casernes disponibles et les moyens d'intervention sur Tunis ?",
  "Analyse l'impact de la météo pluvieuse et des travaux sur le risque routier.",
];
