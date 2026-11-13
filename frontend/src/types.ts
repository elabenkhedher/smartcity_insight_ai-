export type StatutAlerte =
  | 'A_CONFIRMER'
  | 'CONFIRME'
  | 'PRISE_EN_CHARGE'
  | 'EN_INTERVENTION'
  | 'CLOTURE';

export type GraviteAlerte = 'FAIBLE' | 'MOYENNE' | 'GRAVE';

export interface Alerte {
  id: number;
  statut: StatutAlerte;
  gravite: GraviteAlerte;
  adresse: string;
  latitude: number;
  longitude: number;
  nb_signalements: number;
  date_creation?: string;
  date_confirmation?: string | null;
  date_prise_en_charge?: string | null;
  date_en_intervention?: string | null;
  date_cloture?: string | null;
}

export interface Caserne {
  id: string;
  nom: string;
  adresse: string;
  latitude: number;
  longitude: number;
  telephone: string;
  ambulances_disponibles: number;
  camions_disponibles: number;
  statut: string;
}

export interface RouteInfo {
  caserne: Caserne;
  alerte: Alerte;
  distanceKm: number;
  durationMinutes: number;
  durationWithTrafficMinutes?: number;
  trafficDelayMinutes?: number;
  steps: string[];
  polylineCoordinates?: [number, number][];
}

export interface RiskMapResult {
  score_risque_pourcentage: number;
  niveau_risk_map: string;
  facteurs_explicatifs: string[];
}

// =============================================================================
// Module Signalements Citoyens & Dashboard Municipal (Étudiant 2)
// =============================================================================

export type CategorieSignalement =
  | 'ACCIDENT'
  | 'NID_DE_POULE'
  | 'ECLAIRAGE'
  | 'DECHETS'
  | 'SIGNALISATION'
  | 'AUTRE';

export type GraviteSignalement = 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'CRITIQUE';

export type StatutSignalement =
  | 'EN_ATTENTE'
  | 'CONFIRME'
  | 'EN_COURS'
  | 'RESOLU'
  | 'REJETE_SPAM';

export interface Signalement {
  id: string;
  categorie: CategorieSignalement;
  gravite: GraviteSignalement;
  description: string;
  latitude: number;
  longitude: number;
  adresse_texte: string;
  quartier: string;
  photo_floutee?: string | null;
  visages_plaques_floutes: boolean;
  nb_zones_floutees: number;
  statut: StatutSignalement;
  ip_emetteur?: string | null;
  date_creation: string;
  date_mise_a_jour?: string;
}

export interface CreateSignalementPayload {
  categorie: CategorieSignalement;
  gravite: GraviteSignalement;
  description: string;
  latitude: number;
  longitude: number;
  adresse_texte?: string;
  quartier?: string;
  photo?: File | null;
}

export type UserRole = 'CITOYEN' | 'RESPONSABLE_MUNICIPAL';

export type PlatformRole = 'RESPONSABLE_MUNICIPAL' | 'CITOYEN' | 'PROTECTION_CIVILE';

export type AuthMode = 'LOGIN' | 'REGISTER';

export interface UserSession {
  id?: number | string;
  username: string;
  email: string;
  role: PlatformRole;
  est_responsable_municipal?: boolean;
  code_arrondissement?: string;
  telephone_cin?: string;
  matricule_agent?: string;
  token?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  est_responsable_municipal: boolean;
}

export interface LoginResponse {
  access: string;
  token_type: 'Bearer';
  user: AuthUser;
}

export interface SignalementStatistiques {
  total_signalements: number;
  par_statut: Record<string, number>;
  par_categorie: Record<string, number>;
  par_gravite: Record<string, number>;
  par_quartier: { quartier: string; total: number }[];
  conformite_inpdp: {
    photos_floutees: number;
    total_zones_floutees: number;
  };
  taux_resolution_pourcent: number;
}

