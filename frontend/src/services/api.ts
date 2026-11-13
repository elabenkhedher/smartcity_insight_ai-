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
  UserSession,
  ZoneRisque,
  AssistantLLMResponse,
  JournalAuditEntry,
  PostGISStats,
} from '../types';

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export const API_BASE_URL = `${BACKEND_URL}/api/`;

export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws/protection-civile/';

const AUTH_TOKEN_KEY = 'smartcity_jwt_token';
const AUTH_USER_KEY = 'smartcity_auth_user';
const UNIFIED_SESSION_KEY = 'smartcity_unified_session';

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

export function getActiveSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(UNIFIED_SESSION_KEY);
    if (raw) return JSON.parse(raw) as UserSession;
    // Fallback sur AuthUser si disponible
    const user = getStoredUser();
    if (user) {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role === 'RESPONSABLE_MUNICIPAL' ? 'RESPONSABLE_MUNICIPAL' : 'CITOYEN',
        est_responsable_municipal: user.est_responsable_municipal,
        token: getAuthToken() || undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setActiveSession(session: UserSession, token?: string): void {
  try {
    localStorage.setItem(UNIFIED_SESSION_KEY, JSON.stringify(session));
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    // Synchroniser avec AuthUser si applicable
    const authUser: AuthUser = {
      id: typeof session.id === 'number' ? session.id : 1,
      username: session.username || session.email.split('@')[0],
      email: session.email,
      role: session.role === 'RESPONSABLE_MUNICIPAL' ? 'RESPONSABLE_MUNICIPAL' : 'CITOYEN',
      est_responsable_municipal: session.role === 'RESPONSABLE_MUNICIPAL',
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
  } catch (err) {
    console.warn('Impossible de sauvegarder la session utilisateur unifiée:', err);
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(UNIFIED_SESSION_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function setAuthSession(token: string, user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    const unifiedSession: UserSession = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      est_responsable_municipal: user.est_responsable_municipal,
      token,
    };
    localStorage.setItem(UNIFIED_SESSION_KEY, JSON.stringify(unifiedSession));
  } catch (err) {
    console.warn('Impossible de sauvegarder la session auth:', err);
  }
}

export function clearAuthSession(): void {
  clearActiveSession();
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
 * Inscription d'un nouvel utilisateur (Citoyen ou Responsable Municipal)
 */
export async function registerAccount(payload: {
  email: string;
  password: string;
  role: 'CITOYEN' | 'RESPONSABLE_MUNICIPAL';
  username?: string;
}): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('signalements/auth/register/', payload);
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
    console.warn('Backend alertes API non joignable, fallback local', err);
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
  horodatage?: string;
}> {
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

export async function declarerSignalement(payload: {
  latitude: number;
  longitude: number;
  adresse: string;
  description?: string;
  gravite: string;
  valide_par_agent?: boolean;
}): Promise<any> {
  const res = await apiClient.post('urgences/signalement/', payload);
  return res.data;
}

export async function predictRiskMap(params: {
  trafic_index: number;
  presence_travaux: number;
  meteo_pluie: number;
  incidents_recents: number;
  complexite_geometrique?: number;
}): Promise<RiskMapResult> {
  const res = await apiClient.post('urgences/risk-map/', params);
  return res.data.donnees_zone;
}

export async function fetchZonesRiskMap(): Promise<ZoneRisque[]> {
  try {
    const res = await apiClient.get<ZoneRisque[]>('urgences/risk-map/zones/');
    return res.data;
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
  const res = await apiClient.post<AssistantLLMResponse>('urgences/assistant-llm/', { question });
  return res.data;
}

export async function fetchAuditLogs(): Promise<JournalAuditEntry[]> {
  try {
    const res = await apiClient.get<JournalAuditEntry[]>('urgences/audits/');
    return res.data;
  } catch (err) {
    console.warn('API Audits non joignable', err);
    return [];
  }
}

export async function fetchPostGISStats(): Promise<PostGISStats> {
  try {
    const res = await apiClient.get<PostGISStats>('urgences/postgis-statistiques/');
    return res.data;
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
