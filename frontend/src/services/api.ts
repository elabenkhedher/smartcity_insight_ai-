import axios from 'axios';
import {
  Alerte,
  AuthUser,
  Caserne,
  LoginResponse,
  RiskMapResult,
  StatutAlerte,
  Signalement,
  SignalementStatistiques,
  StatutSignalement,
} from '../types';

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export const API_BASE_URL = `${BACKEND_URL}/api/`;

export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws/protection-civile/';

const AUTH_TOKEN_KEY = 'smartcity_jwt_token';
const AUTH_USER_KEY = 'smartcity_auth_user';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('Impossible de sauvegarder la session auth:', err);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Client Axios configuré pour pointer sur le backend Django REST Framework
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Intercepteur HTTP : injecte automatiquement le jeton JWT (Authorization: Bearer ...)
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de réponse : purge un jeton invalide/expiré sur 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const reqUrl: string = error?.config?.url || '';
    if (status === 401 && !reqUrl.includes('auth/login')) {
      clearAuthSession();
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// Authentification Responsable Municipal (Étudiant 2)
// =============================================================================

/**
 * Authentifie l'utilisateur et stocke son JWT Bearer + profil dans localStorage
 */
export async function loginMunicipal(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('signalements/auth/login/', {
    username,
    password,
  });
  setAuthSession(response.data.access, response.data.user);
  return response.data;
}

/**
 * Vérifie la session courante auprès du backend
 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>('signalements/auth/me/');
  return response.data;
}

export function logoutMunicipal(): void {
  clearAuthSession();
}

// =============================================================================
// API Signalements Citoyens & Dashboard Municipal (Étudiant 2)
// =============================================================================

export interface SignalementFilterParams {
  quartier?: string;
  statut?: string;
  categorie?: string;
}

/**
 * Récupère la liste des signalements citoyens avec filtres optionnels
 */
export async function getSignalements(
  params?: SignalementFilterParams
): Promise<Signalement[]> {
  const cleanParams: Record<string, string> = {};
  if (params?.quartier && params.quartier !== 'TOUS') {
    cleanParams.quartier = params.quartier;
  }
  if (params?.statut && params.statut !== 'TOUS') {
    cleanParams.statut = params.statut;
  }
  if (params?.categorie && params.categorie !== 'TOUS') {
    cleanParams.categorie = params.categorie;
  }

  const response = await apiClient.get<Signalement[]>('signalements/', {
    params: cleanParams,
  });
  return response.data;
}

/**
 * Récupère un signalement par son identifiant UUID
 */
export async function getSignalementById(id: string): Promise<Signalement> {
  const response = await apiClient.get<Signalement>(`signalements/${id}/`);
  return response.data;
}

/**
 * Crée un nouveau signalement (avec photo facultative en multipart/form-data)
 */
export async function createSignalement(
  formData: FormData
): Promise<Signalement> {
  const response = await apiClient.post<Signalement>('signalements/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Met à jour le statut d'un signalement via l'endpoint sécurisé /changer-statut/
 * (réservé au Responsable Municipal)
 */
export async function changerStatutSignalement(
  id: string,
  statut: StatutSignalement
): Promise<Signalement> {
  const response = await apiClient.post<Signalement>(
    `signalements/${id}/changer-statut/`,
    { statut }
  );
  return response.data;
}

/**
 * Alias rétro-compatible pour mise à jour du statut d'un signalement
 */
export async function updateSignalementStatut(
  id: string,
  statut: StatutSignalement
): Promise<Signalement> {
  return changerStatutSignalement(id, statut);
}

/**
 * Récupère les statistiques globales et de conformité INPDP
 * (endpoint sécurisé réservé au Responsable Municipal)
 */
export async function getSignalementStatistiques(): Promise<SignalementStatistiques> {
  const response = await apiClient.get<SignalementStatistiques>(
    'signalements/statistiques/'
  );
  return response.data;
}

/**
 * Récupère la vue complète de supervision municipale (incluant IP émettrice)
 */
export async function getSignalementSupervision(
  params?: SignalementFilterParams
): Promise<{ total: number; signalements: Signalement[] }> {
  const cleanParams: Record<string, string> = {};
  if (params?.quartier && params.quartier !== 'TOUS') {
    cleanParams.quartier = params.quartier;
  }
  if (params?.statut && params.statut !== 'TOUS') {
    cleanParams.statut = params.statut;
  }
  if (params?.categorie && params.categorie !== 'TOUS') {
    cleanParams.categorie = params.categorie;
  }
  const response = await apiClient.get<{ total: number; signalements: Signalement[] }>(
    'signalements/supervision/',
    { params: cleanParams }
  );
  return response.data;
}

// =============================================================================
// Passerelles Module Urgences & Protection Civile (Étudiant 3)
// =============================================================================

export async function fetchAlertes(): Promise<Alerte[]> {
  try {
    const res = await apiClient.get<Alerte[]>('urgences/alertes/');
    return res.data;
  } catch (err) {
    console.warn('Backend alertes API non joignable, fallback vide', err);
    return [];
  }
}

export async function fetchCasernes(): Promise<Caserne[]> {
  try {
    const res = await apiClient.get<Caserne[]>('urgences/casernes/');
    return res.data;
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
  const res = await apiClient.post(`urgences/alerte/${alerteId}/statut/`, {
    statut,
  });
  return res.data;
}

export async function simulerAccident(payload?: {
  latitude?: number;
  longitude?: number;
  adresse?: string;
  gravite?: string;
  description?: string;
}): Promise<any> {
  const res = await apiClient.post('urgences/simuler-accident/', payload || {});
  return res.data;
}

export async function predictRiskMap(params: {
  trafic_index: number;
  presence_travaux: number;
  meteo_pluie: number;
  incidents_recents: number;
}): Promise<RiskMapResult> {
  const res = await apiClient.post('urgences/risk-map/', params);
  return res.data.donnees_zone;
}
