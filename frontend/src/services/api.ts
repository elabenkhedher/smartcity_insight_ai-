import {
  Alerte,
  Caserne,
  RiskMapResult,
  StatutAlerte,
  ZoneRisque,
  AssistantLLMResponse,
  JournalAuditEntry,
  PostGISStats,
} from '../types';

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws/protection-civile/';

export async function fetchAlertes(): Promise<Alerte[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/urgences/alertes/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend alertes API non joignable, fallback local', err);
    return [];
  }
}

export async function fetchCasernes(): Promise<Caserne[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/urgences/casernes/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend casernes API non joignable, fallback statique', err);
    return [
      {
        id: 'caserne-bab-el-khadra',
        nom: 'Caserne Centrale — Bab El Khadra',
        adresse: 'Avenue Habib Thameur / Bab El Khadra, Tunis',
        latitude: 36.8123,
        longitude: 10.1784,
        telephone: '198 / +216 71 345 678',
        ambulances_disponibles: 3,
        camions_disponibles: 2,
        statut: 'OPERATIONNELLE',
      },
      {
        id: 'caserne-bab-saadoun',
        nom: 'Caserne Médina Ouest — Bab Saadoun',
        adresse: 'Place Bab Saadoun, Tunis',
        latitude: 36.8095,
        longitude: 10.1582,
        telephone: '198 / +216 71 560 123',
        ambulances_disponibles: 2,
        camions_disponibles: 1,
        statut: 'OPERATIONNELLE',
      },
      {
        id: 'caserne-montplaisir',
        nom: 'Caserne Lac & Montplaisir',
        adresse: 'Avenue du Japon, Montplaisir, Tunis',
        latitude: 36.8248,
        longitude: 10.1906,
        telephone: '198 / +216 71 840 990',
        ambulances_disponibles: 4,
        camions_disponibles: 2,
        statut: 'OPERATIONNELLE',
      },
      {
        id: 'caserne-goulette',
        nom: 'Caserne Port & Banlieue Nord — La Goulette',
        adresse: 'Avenue Franklin Roosevelt, La Goulette',
        latitude: 36.8182,
        longitude: 10.3045,
        telephone: '198 / +216 71 735 000',
        ambulances_disponibles: 2,
        camions_disponibles: 2,
        statut: 'OPERATIONNELLE',
      },
      {
        id: 'caserne-ariana',
        nom: 'Caserne Ariana Centre',
        adresse: 'Avenue Taïeb Mhiri, Ariana',
        latitude: 36.8625,
        longitude: 10.1956,
        telephone: '198 / +216 71 710 400',
        ambulances_disponibles: 3,
        camions_disponibles: 2,
        statut: 'OPERATIONNELLE',
      },
    ];
  }
}

export async function updateStatutAlerte(
  alerteId: number,
  statut: StatutAlerte
): Promise<{
  alerte_id: number;
  nouveau_statut: string;
  date_confirmation?: string;
  date_prise_en_charge?: string;
  date_en_intervention?: string;
  date_cloture?: string;
}> {
  const res = await fetch(`${API_BASE_URL}/api/urgences/alerte/${alerteId}/statut/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statut }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function simulerAccident(payload?: {
  latitude?: number;
  longitude?: number;
  adresse?: string;
  gravite?: string;
  description?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/urgences/simuler-accident/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function declarerSignalement(payload: {
  latitude: number;
  longitude: number;
  adresse: string;
  description?: string;
  gravite: string;
  valide_par_agent?: boolean;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/urgences/signalement/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function predictRiskMap(params: {
  trafic_index: number;
  presence_travaux: number;
  meteo_pluie: number;
  incidents_recents: number;
  complexite_geometrique?: number;
}): Promise<RiskMapResult> {
  const res = await fetch(`${API_BASE_URL}/api/urgences/risk-map/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();
  return data.donnees_zone;
}

export async function fetchZonesRiskMap(): Promise<ZoneRisque[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/urgences/risk-map/zones/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API Zones RiskMap non joignable, fallback métropolitain', err);
    return [
      {
        id: 'sec-bab-alioua',
        nom: 'Échangeur Bab Alioua (Sortie Sud)',
        arrondissement: 'Sidi El Béchir / Entrée Sud Tunis',
        latitude: 36.7865,
        longitude: 10.1832,
        rayon_metres: 550,
        complexite_geometrique: 3,
        trafic_index: 4.6,
        presence_travaux: 1,
        meteo_pluie: 0,
        incidents_recents: 8,
        score_risque_pourcentage: 92.0,
        niveau_risk_map: 'ROUGE',
        label_niveau: 'ÉLEVÉ / CRITIQUE (ROUGE)',
        facteurs_explicatifs: [
          'Trafic très dense en direct (Indice 4.6/5)',
          'Géométrie critique du tronçon : Échangeur autoroutier à flux croisés multiples',
          'Historique lourd : 8 accidents recensés ces 30 derniers jours',
          'Chantier actif : Réduction de voies et présence d’obstacles de voirie',
        ],
        points_polygone: [
          [36.7890, 10.1810],
          [36.7892, 10.1860],
          [36.7845, 10.1870],
          [36.7840, 10.1815],
        ],
      },
      {
        id: 'sec-route-x-bardo',
        nom: 'Route X — Rond-Point du Bardo',
        arrondissement: 'Le Bardo / Axe Rapide Ouest',
        latitude: 36.8115,
        longitude: 10.1384,
        rayon_metres: 500,
        complexite_geometrique: 2,
        trafic_index: 3.7,
        presence_travaux: 1,
        meteo_pluie: 0,
        incidents_recents: 5,
        score_risque_pourcentage: 72.4,
        niveau_risk_map: 'ROUGE',
        label_niveau: 'ÉLEVÉ / CRITIQUE (ROUGE)',
        facteurs_explicatifs: [
          'Trafic très dense en direct (Indice 3.7/5)',
          'Géométrie sensible : Carrefour dense à fort taux d’insertions latérales',
          'Historique lourd : 5 incidents récents sur ce secteur',
          'Chantier actif : Réduction de voies',
        ],
        points_polygone: [
          [36.8140, 10.1350],
          [36.8145, 10.1415],
          [36.8088, 10.1420],
          [36.8085, 10.1360],
        ],
      },
      {
        id: 'sec-rn9-ain-zaghouan',
        nom: 'Route de La Marsa (RN9) — Ain Zaghouan',
        arrondissement: 'La Marsa / Banlieue Nord',
        latitude: 36.8524,
        longitude: 10.2785,
        rayon_metres: 500,
        complexite_geometrique: 2,
        trafic_index: 3.4,
        presence_travaux: 0,
        meteo_pluie: 0,
        incidents_recents: 3,
        score_risque_pourcentage: 54.8,
        niveau_risk_map: 'ORANGE',
        label_niveau: 'MODÉRÉ / VIGILANCE (ORANGE)',
        facteurs_explicatifs: [
          'Flux de circulation soutenu (Indice 3.4/5)',
          'Géométrie sensible : Insertions rapides axe express RN9',
          'Historique modéré : 3 incidents récents',
        ],
        points_polygone: [
          [36.8550, 10.2740],
          [36.8560, 10.2830],
          [36.8495, 10.2825],
          [36.8490, 10.2745],
        ],
      },
      {
        id: 'sec-bourguiba-centre',
        nom: 'Avenue Habib Bourguiba (Tunis Centre)',
        arrondissement: 'Bab Bhar / Tunis Centre',
        latitude: 36.8002,
        longitude: 10.1865,
        rayon_metres: 400,
        complexite_geometrique: 1,
        trafic_index: 2.2,
        presence_travaux: 0,
        meteo_pluie: 0,
        incidents_recents: 1,
        score_risque_pourcentage: 22.0,
        niveau_risk_map: 'VERT',
        label_niveau: 'FAIBLE (VERT)',
        facteurs_explicatifs: [
          'Vitesse modérée et signalisation dense',
          'Conditions de circulation fluides et chaussée dégagée',
        ],
        points_polygone: [
          [36.8020, 10.1820],
          [36.8025, 10.1910],
          [36.7980, 10.1905],
          [36.7975, 10.1825],
        ],
      },
    ];
  }
}

export async function interrogerAssistantLLM(question: string): Promise<AssistantLLMResponse> {
  const res = await fetch(`${API_BASE_URL}/api/urgences/assistant-llm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function fetchAuditLogs(): Promise<JournalAuditEntry[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/urgences/audits/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API Audits non joignable', err);
    return [];
  }
}

export async function fetchPostGISStats(): Promise<PostGISStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/urgences/postgis-statistiques/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API Stats PostGIS non joignable', err);
    return {
      total_signalements_recus: 42,
      total_alertes_qualifiees: 18,
      alertes_isolees_mises_en_observation: 6,
      taux_elimination_fausses_alertes_pourcentage: 25.0,
      rayon_regroupement_metres: 150,
      seuil_confirmation: 3,
      latence_diffusion_temps_reel: '< 3.8s',
    };
  }
}
