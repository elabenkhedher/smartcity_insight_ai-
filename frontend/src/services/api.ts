import { Alerte, Caserne, RiskMapResult, StatutAlerte } from '../types';

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
    console.warn('Backend alertes API non joignable, utilisation des données locales si dispo', err);
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
        nom: 'Caserne Centrale - Bab El Khadra',
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
        nom: 'Caserne Médina Ouest - Bab Saadoun',
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
        nom: 'Caserne Port & Banlieue Nord - La Goulette',
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
): Promise<{ alerte_id: number; nouveau_statut: string; horodatage: string }> {
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

export async function predictRiskMap(params: {
  trafic_index: number;
  presence_travaux: number;
  meteo_pluie: number;
  incidents_recents: number;
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
