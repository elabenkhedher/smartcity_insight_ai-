export type Role =
  | 'PROTECTION_CIVILE'
  | 'DECIDEUR_MUNICIPAL'
  | 'ADMIN_SYSTEME';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  badgeNumber?: string;
  department: string;
  assignedZone?: string;
  avatarInitials: string;
}

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
  description?: string;
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
  niveau_risk_map: 'VERT' | 'ORANGE' | 'ROUGE' | string;
  label_niveau?: string;
  facteurs_explicatifs: string[];
  details_probabilites?: {
    faible_vert: number;
    modere_orange: number;
    eleve_rouge: number;
  };
}

export interface ZoneRisque {
  id: string;
  nom: string;
  arrondissement: string;
  latitude: number;
  longitude: number;
  rayon_metres: number;
  complexite_geometrique: number;
  trafic_index: number;
  presence_travaux: number;
  meteo_pluie: number;
  incidents_recents: number;
  score_risque_pourcentage: number;
  niveau_risk_map: 'VERT' | 'ORANGE' | 'ROUGE';
  label_niveau: string;
  facteurs_explicatifs: string[];
  points_polygone?: [number, number][];
}

export interface AssistantLLMResponse {
  question: string;
  reponse: string;
  sources_donnees_reelles: string[];
  score_confiance: number;
  horodatage: string;
}

export interface PostGISStats {
  total_signalements_recus: number;
  total_alertes_qualifiees: number;
  alertes_isolees_mises_en_observation: number;
  taux_elimination_fausses_alertes_pourcentage: number;
  rayon_regroupement_metres: number;
  seuil_confirmation: number;
  latence_diffusion_temps_reel: string;
}

export interface JournalAuditEntry {
  id: string;
  horodatage: string;
  utilisateur: string;
  role?: string;
  action: string;
  details?: string;
  entite_cible?: string;
  niveau: 'INFO' | 'AVERTISSEMENT' | 'CRITIQUE';
  alerte_id?: number | null;
}
