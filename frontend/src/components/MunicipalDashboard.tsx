import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  Clock,
  Filter,
  Image as ImageIcon,
  Layers,
  LogOut,
  MapPin,
  Play,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import {
  BACKEND_URL,
  changerStatutSignalement,
  fetchCurrentUser,
  getAuthToken,
  getSignalements,
  getSignalementStatistiques,
  getStoredUser,
  logoutMunicipal,
} from '../services/api';
import {
  AuthUser,
  CategorieSignalement,
  GraviteSignalement,
  Signalement,
  SignalementStatistiques,
  StatutSignalement,
} from '../types';
import { MunicipalLogin } from './MunicipalLogin';

const QUARTIERS_LIST = [
  'TOUS',
  'Centre-Ville Tunis',
  'Bab El Khadra',
  'Bab Saadoun',
  'Montplaisir',
  'La Goulette',
  'Lafayette',
  'Ariana Centre',
  'Le Bardo',
  'El Menzah',
  'El Manar',
];

const STATUTS_CONFIG: Record<
  StatutSignalement,
  { label: string; color: string; bg: string }
> = {
  EN_ATTENTE: {
    label: 'En attente',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  CONFIRME: {
    label: 'Confirmé',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
  },
  EN_COURS: {
    label: 'En cours',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
  },
  RESOLU: {
    label: 'Résolu',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  REJETE_SPAM: {
    label: 'Rejeté / Spam',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
  },
};

const GRAVITE_CONFIG: Record<
  GraviteSignalement,
  { label: string; color: string; weight: number }
> = {
  CRITIQUE: { label: 'Critique', color: '#ef4444', weight: 40 },
  ELEVEE: { label: 'Élevée', color: '#f97316', weight: 30 },
  MOYENNE: { label: 'Moyenne', color: '#f59e0b', weight: 20 },
  FAIBLE: { label: 'Faible', color: '#10b981', weight: 10 },
};

const CATEGORIE_META: Record<
  CategorieSignalement,
  { label: string; icon: string; mobilityWeight: number; mobilityLabel: string }
> = {
  ACCIDENT: {
    label: 'Accident',
    icon: '💥',
    mobilityWeight: 35,
    mobilityLabel: 'Impact Critique Mobilité',
  },
  SIGNALISATION: {
    label: 'Signalisation',
    icon: '🛑',
    mobilityWeight: 25,
    mobilityLabel: 'Impact Élevé Trafic',
  },
  NID_DE_POULE: {
    label: 'Nid-de-poule',
    icon: '🕳️',
    mobilityWeight: 20,
    mobilityLabel: 'Impact Modéré Chaussée',
  },
  ECLAIRAGE: {
    label: 'Éclairage public',
    icon: '💡',
    mobilityWeight: 15,
    mobilityLabel: 'Sécurité Nocturne',
  },
  DECHETS: {
    label: 'Déchets / Voirie',
    icon: '🗑️',
    mobilityWeight: 10,
    mobilityLabel: 'Encombrement Voirie',
  },
  AUTRE: {
    label: 'Autre incident',
    icon: '⚠️',
    mobilityWeight: 5,
    mobilityLabel: 'Impact Standard',
  },
};

function computeInterventionPriority(s: Signalement) {
  const gravWeight = GRAVITE_CONFIG[s.gravite]?.weight ?? 10;
  const catMeta = CATEGORIE_META[s.categorie] ?? CATEGORIE_META.AUTRE;

  if (s.statut === 'RESOLU' || s.statut === 'REJETE_SPAM') {
    return {
      score: s.statut === 'RESOLU' ? -50 : -100,
      badge: s.statut === 'RESOLU' ? 'CLÔTURÉ' : 'SPAM',
      badgeColor: '#64748b',
      badgeBg: 'rgba(100, 116, 139, 0.15)',
      mobilityLabel: catMeta.mobilityLabel,
    };
  }

  const statutBoost =
    s.statut === 'EN_ATTENTE' ? 20 : s.statut === 'CONFIRME' ? 15 : 10;
  const score = gravWeight + catMeta.mobilityWeight + statutBoost;

  if (score >= 75) {
    return {
      score,
      badge: 'P1 — URGENCE MOBILITÉ',
      badgeColor: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.18)',
      mobilityLabel: catMeta.mobilityLabel,
    };
  }
  if (score >= 55) {
    return {
      score,
      badge: 'P2 — PRIORITÉ ÉLEVÉE',
      badgeColor: '#f97316',
      badgeBg: 'rgba(249, 115, 22, 0.18)',
      mobilityLabel: catMeta.mobilityLabel,
    };
  }
  return {
    score,
    badge: 'P3 — STANDARD',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    mobilityLabel: catMeta.mobilityLabel,
  };
}

export const MunicipalDashboard: React.FC = () => {
  const navigate = useNavigate();

  // État d'authentification
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    getAuthToken() ? getStoredUser() : null
  );
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);

  // Données & filtres du dashboard
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [globalStats, setGlobalStats] = useState<SignalementStatistiques | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedQuartier, setSelectedQuartier] = useState('TOUS');
  const [selectedStatut, setSelectedStatut] = useState<string>('TOUS');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('TOUS');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'PRIORITY' | 'RECENT'>('PRIORITY');

  const [modalImage, setModalImage] = useState<{
    url: string;
    zones: number;
    title: string;
  } | null>(null);

  const handleLogout = () => {
    logoutMunicipal();
    setCurrentUser(null);
    setAccessDeniedError(null);
    setGlobalStats(null);
    setSignalements([]);
  };

  // Chargement conjoint des statistiques sécurisées (/statistiques/) et des signalements
  const loadDashboardData = useCallback(async () => {
    if (!getAuthToken()) return;
    setIsLoading(true);
    setActionError(null);

    try {
      const [statsRes, reportsRes] = await Promise.all([
        getSignalementStatistiques(),
        getSignalements({
          quartier: selectedQuartier !== 'TOUS' ? selectedQuartier : undefined,
          statut: selectedStatut !== 'TOUS' ? selectedStatut : undefined,
          categorie: selectedCategorie !== 'TOUS' ? selectedCategorie : undefined,
        }),
      ]);
      setGlobalStats(statsRes);
      setSignalements(reportsRes);
      setAccessDeniedError(null);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        handleLogout();
      } else if (status === 403) {
        setAccessDeniedError(
          err?.response?.data?.detail ||
            'Accès refusé (HTTP 403) : cet espace de supervision est réservé exclusivement au Responsable Municipal.'
        );
      } else {
        setActionError(
          err?.response?.data?.detail ||
            'Erreur lors du chargement des données du tableau de bord.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedQuartier, selectedStatut, selectedCategorie]);

  // Vérification initiale de session si un jeton existe déjà en stockage
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    fetchCurrentUser()
      .then((verifiedUser) => {
        setCurrentUser(verifiedUser);
        if (!verifiedUser.est_responsable_municipal) {
          setAccessDeniedError(
            `Votre compte (${verifiedUser.username}) possède le rôle "${verifiedUser.role}". Seul un Responsable Municipal peut accéder au pilotage.`
          );
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          handleLogout();
        }
      });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadDashboardData();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser, loadDashboardData]);

  const handleLoginSuccess = (user: AuthUser) => {
    setAccessDeniedError(null);
    setCurrentUser(user);
  };

  // Transition de statut via /api/signalements/{id}/changer-statut/
  const handleStatutChange = async (id: string, newStatut: StatutSignalement) => {
    setUpdatingId(id);
    setActionError(null);
    try {
      const updated = await changerStatutSignalement(id, newStatut);
      setSignalements((prev) =>
        prev.map((s) => (s.id === id ? { ...s, statut: updated.statut } : s))
      );
      // Rafraîchit immédiatement les statistiques globales (/statistiques/)
      const refreshedStats = await getSignalementStatistiques();
      setGlobalStats(refreshedStats);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        setAccessDeniedError(
          err?.response?.data?.detail ||
            'Action bloquée (HTTP 403) : droits Responsable Municipal requis.'
        );
      } else if (status === 401) {
        handleLogout();
      } else {
        setActionError(
          err?.response?.data?.detail ||
            'Impossible de mettre à jour le statut du signalement.'
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtrage recherche texte + tri par Priorité (Gravité & Mobilité) ou Date
  const processedReports = useMemo(() => {
    let items = signalements;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (s) =>
          s.description.toLowerCase().includes(q) ||
          s.adresse_texte.toLowerCase().includes(q) ||
          s.quartier.toLowerCase().includes(q) ||
          s.categorie.toLowerCase().includes(q)
      );
    }

    const withPriority = items.map((s) => ({
      item: s,
      priority: computeInterventionPriority(s),
    }));

    if (sortMode === 'PRIORITY') {
      withPriority.sort((a, b) => b.priority.score - a.priority.score);
    } else {
      withPriority.sort(
        (a, b) =>
          new Date(b.item.date_creation).getTime() -
          new Date(a.item.date_creation).getTime()
      );
    }

    return withPriority;
  }, [signalements, searchQuery, sortMode]);

  const getFullImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // 1. Si non connecté -> écran de connexion Responsable Municipal
  if (!currentUser) {
    return <MunicipalLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Si connecté mais non autorisé (rôle CITOYEN ou erreur 403 backend) -> écran Accès Refusé propre
  if (accessDeniedError || !currentUser.est_responsable_municipal) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <ShieldAlert size={30} color="#ef4444" />
          </div>

          <h2 style={{ fontSize: 21, fontWeight: 700, color: '#fca5a5', marginBottom: 10 }}>
            Accès Refusé — Droits Insuffisants (403)
          </h2>

          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 18 }}>
            {accessDeniedError ||
              `Le compte "${currentUser.username}" possède le rôle "${currentUser.role}". L'accès aux statistiques globales et à la supervision municipale est réservé exclusivement au Responsable Municipal.`}
          </p>

          <div
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12.5,
              color: 'var(--text-dim)',
              marginBottom: 22,
            }}
          >
            Compte actif : <strong style={{ color: 'var(--text-main)' }}>{currentUser.username}</strong> •
            Rôle : <code style={{ color: '#f59e0b' }}>{currentUser.role}</code>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #0284c7)',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                color: '#fff',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <LogOut size={15} /> Se connecter avec un autre compte
            </button>
            <button
              onClick={() => navigate('/citoyen')}
              style={{
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: '10px 18px',
                color: 'var(--text-main)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Aller au Portail Citoyen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extraction des KPIs depuis /api/signalements/statistiques/
  const totalSignalements = globalStats?.total_signalements ?? signalements.length;
  const enAttenteCount = globalStats?.par_statut?.EN_ATTENTE ?? 0;
  const enCoursCount =
    (globalStats?.par_statut?.EN_COURS ?? 0) +
    (globalStats?.par_statut?.CONFIRME ?? 0);
  const resolusCount = globalStats?.par_statut?.RESOLU ?? 0;
  const tauxResolution = globalStats?.taux_resolution_pourcent ?? 0;
  const photosFlouteesCount = globalStats?.conformite_inpdp?.photos_floutees ?? 0;
  const zonesFlouteesCount = globalStats?.conformite_inpdp?.total_zones_floutees ?? 0;

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 20px' }}>
      {/* En-tête + Barre de session Responsable Municipal */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(6, 182, 212, 0.12)',
              color: '#22d3ee',
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            <ShieldCheck size={14} /> Pilotage Municipal & Supervision INPDP
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Tableau de Bord du Responsable Municipal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '4px 0 0' }}>
            Statistiques globales en temps réel et file d'interventions priorisée par gravité et impact mobilité.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '7px 12px',
              borderRadius: 8,
              fontSize: 12.5,
              color: '#34d399',
              fontWeight: 600,
            }}
          >
            <UserCheck size={15} />
            <span>{currentUser.username}</span>
            <span
              style={{
                fontSize: 10.5,
                background: 'rgba(16, 185, 129, 0.2)',
                padding: '1px 6px',
                borderRadius: 6,
              }}
            >
              RESPONSABLE
            </span>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: 8,
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              borderRadius: 8,
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <LogOut size={15} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Alerte erreur éventuelle sur action */}
      {actionError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fca5a5',
            fontSize: 13.5,
          }}
        >
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Cartes KPI alimentées par /api/signalements/statistiques/ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              Total Signalements
            </span>
            <Layers size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>
            {totalSignalements}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 4 }}>
            Base globale municipale
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              En attente
            </span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>
            {enAttenteCount}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 4 }}>
            À qualifier / assigner
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              En intervention
            </span>
            <Zap size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#06b6d4' }}>
            {enCoursCount}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 4 }}>
            Pris en charge voirie
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              Résolus & Performance
            </span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
              {resolusCount}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>
              ({tauxResolution}%)
            </span>
          </div>
          <div
            style={{
              height: 5,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.08)',
              marginTop: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, tauxResolution)}%`,
                height: '100%',
                background: '#10b981',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>
              Conformité INPDP
            </span>
            <ShieldCheck size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
            {photosFlouteesCount}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {zonesFlouteesCount} visage(s) & plaque(s) flouté(s)
          </div>
        </div>
      </div>

      {/* Synthèse statistique par Catégorie & Top Quartiers (issu de /statistiques/) */}
      {globalStats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
              <BarChart3 size={16} color="#38bdf8" />
              <span>Répartition par Catégorie</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(globalStats.par_categorie || {}).map(([cat, count]) => {
                const meta = CATEGORIE_META[cat as CategorieSignalement] || {
                  label: cat,
                  icon: '📍',
                };
                return (
                  <div
                    key={cat}
                    style={{
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{meta.label} :</span>
                    <strong style={{ color: 'var(--text-main)' }}>{count}</strong>
                  </div>
                );
              })}
              {Object.keys(globalStats.par_categorie || {}).length === 0 && (
                <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Aucune donnée disponible.</span>
              )}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
              <Activity size={16} color="#f59e0b" />
              <span>Zones & Quartiers les plus touchés</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(globalStats.par_quartier || []).slice(0, 5).map((q) => (
                <div
                  key={q.quartier}
                  style={{
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <MapPin size={12} color="#38bdf8" />
                  <span style={{ color: 'var(--text-muted)' }}>{q.quartier} :</span>
                  <strong style={{ color: 'var(--text-main)' }}>{q.total}</strong>
                </div>
              ))}
              {(globalStats.par_quartier || []).length === 0 && (
                <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Aucun quartier enregistré.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barre de filtres & tri prioritaire */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
            <Filter size={15} /> Filtres :
          </div>

          <select
            value={selectedQuartier}
            onChange={(e) => setSelectedQuartier(e.target.value)}
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '6px 12px',
              color: 'var(--text-main)',
              fontSize: 13,
            }}
          >
            {QUARTIERS_LIST.map((q) => (
              <option key={q} value={q}>
                {q === 'TOUS' ? 'Tous les quartiers' : q}
              </option>
            ))}
          </select>

          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '6px 12px',
              color: 'var(--text-main)',
              fontSize: 13,
            }}
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="CONFIRME">Confirmé</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLU">Résolu</option>
            <option value="REJETE_SPAM">Rejeté / Spam</option>
          </select>

          <select
            value={selectedCategorie}
            onChange={(e) => setSelectedCategorie(e.target.value)}
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '6px 12px',
              color: 'var(--text-main)',
              fontSize: 13,
            }}
          >
            <option value="TOUS">Toutes les catégories</option>
            <option value="ACCIDENT">Accident</option>
            <option value="SIGNALISATION">Signalisation</option>
            <option value="NID_DE_POULE">Nid-de-poule</option>
            <option value="ECLAIRAGE">Éclairage</option>
            <option value="DECHETS">Déchets</option>
            <option value="AUTRE">Autre</option>
          </select>

          <button
            type="button"
            onClick={() =>
              setSortMode((m) => (m === 'PRIORITY' ? 'RECENT' : 'PRIORITY'))
            }
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 6,
              padding: '6px 12px',
              color: '#38bdf8',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowUpDown size={13} />
            <span>
              {sortMode === 'PRIORITY'
                ? 'Tri : Priorité (Gravité & Mobilité)'
                : 'Tri : Plus récents'}
            </span>
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            padding: '6px 12px',
            minWidth: 220,
          }}
        >
          <Search size={14} color="var(--text-dim)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un signalement..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: 13,
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* File priorisée des interventions */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Chargement de la file de pilotage...</p>
        </div>
      ) : processedReports.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <AlertTriangle size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, color: 'var(--text-main)', marginBottom: 4 }}>
            Aucun signalement trouvé
          </h3>
          <p style={{ fontSize: 13 }}>Modifiez les filtres de recherche ou actualisez la page.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {processedReports.map(({ item: s, priority }) => {
            const catInfo = CATEGORIE_META[s.categorie] || CATEGORIE_META.AUTRE;
            const gravInfo = GRAVITE_CONFIG[s.gravite] || {
              label: s.gravite,
              color: '#94a3b8',
              weight: 10,
            };
            const statutInfo = STATUTS_CONFIG[s.statut] || {
              label: s.statut,
              color: '#94a3b8',
              bg: 'rgba(0,0,0,0.1)',
            };
            const dateStr = new Date(s.date_creation).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const isUpdating = updatingId === s.id;

            return (
              <div
                key={s.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${
                    priority.score >= 75 ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'
                  }`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                {/* Vignette photo floutée */}
                <div style={{ width: 88, height: 88, flexShrink: 0, position: 'relative' }}>
                  {s.photo_floutee ? (
                    <div
                      onClick={() =>
                        setModalImage({
                          url: getFullImageUrl(s.photo_floutee),
                          zones: s.nb_zones_floutees,
                          title: `${catInfo.label} - ${s.quartier}`,
                        })
                      }
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 8,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={getFullImageUrl(s.photo_floutee)}
                        alt={catInfo.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(0, 0, 0, 0.72)',
                          fontSize: 9.5,
                          color: '#34d399',
                          textAlign: 'center',
                          padding: '2px 0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 3,
                        }}
                      >
                        <Shield size={10} /> IA Floutée
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 8,
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-dim)',
                      }}
                    >
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>

                {/* Corps détaillé + Badges Priorité & Mobilité */}
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{catInfo.icon}</span>
                    <strong style={{ fontSize: 14.5, color: 'var(--text-main)' }}>
                      {catInfo.label}
                    </strong>

                    {/* Badge Priorité */}
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: priority.badgeColor,
                        background: priority.badgeBg,
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {priority.badge}
                    </span>

                    {/* Badge Gravité */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: gravInfo.color,
                        border: `1px solid ${gravInfo.color}`,
                        padding: '1px 7px',
                        borderRadius: 10,
                      }}
                    >
                      Gravité : {gravInfo.label}
                    </span>

                    {/* Impact mobilité */}
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        background: 'var(--bg-dark)',
                        padding: '2px 8px',
                        borderRadius: 10,
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {priority.mobilityLabel}
                    </span>

                    {s.visages_plaques_floutes && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.12)',
                          padding: '1px 8px',
                          borderRadius: 10,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <ShieldCheck size={12} /> INPDP ({s.nb_zones_floutees} zone(s))
                      </span>
                    )}

                    <span style={{ fontSize: 11.5, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                      {dateStr}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 13.5,
                      color: 'var(--text-main)',
                      marginBottom: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {s.description || 'Aucune description fournie.'}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 14,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} color="#38bdf8" />
                      <span>
                        <strong>{s.quartier}</strong>
                        {s.adresse_texte && s.adresse_texte !== s.quartier
                          ? ` • ${s.adresse_texte}`
                          : ''}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-dim)' }}>
                      GPS : {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                    </div>

                    {s.ip_emetteur && (
                      <div style={{ color: 'var(--text-dim)' }}>
                        IP : <code>{s.ip_emetteur}</code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions de Supervision & Changement de Statut (/changer-statut/) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    minWidth: 210,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(s.statut === 'EN_ATTENTE' || s.statut === 'CONFIRME') && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatutChange(s.id, 'EN_COURS')}
                        style={{
                          flex: 1,
                          background: 'rgba(6, 182, 212, 0.16)',
                          border: '1px solid rgba(6, 182, 212, 0.45)',
                          color: '#22d3ee',
                          borderRadius: 7,
                          padding: '7px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isUpdating ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                        }}
                      >
                        <Play size={12} /> Prendre en charge
                      </button>
                    )}

                    {s.statut !== 'RESOLU' && s.statut !== 'REJETE_SPAM' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatutChange(s.id, 'RESOLU')}
                        style={{
                          flex: 1,
                          background: 'rgba(16, 185, 129, 0.16)',
                          border: '1px solid rgba(16, 185, 129, 0.45)',
                          color: '#34d399',
                          borderRadius: 7,
                          padding: '7px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isUpdating ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                        }}
                      >
                        <CheckCircle2 size={12} /> Résoudre
                      </button>
                    )}
                  </div>

                  <select
                    aria-label={`Changer le statut du signalement ${s.id}`}
                    disabled={isUpdating}
                    value={s.statut}
                    onChange={(e) =>
                      handleStatutChange(s.id, e.target.value as StatutSignalement)
                    }
                    style={{
                      background: statutInfo.bg,
                      color: statutInfo.color,
                      border: `1px solid ${statutInfo.color}`,
                      borderRadius: 8,
                      padding: '7px 10px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="CONFIRME">Confirmé</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="RESOLU">Résolu</option>
                    <option value="REJETE_SPAM">Rejeté / Spam</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'inspection de photo anonymisée */}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              maxWidth: 750,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color="#10b981" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                  Photo Anonymisée IA (Conformité INPDP)
                </span>
              </div>
              <button
                onClick={() => setModalImage(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 16, textAlign: 'center', background: '#000' }}>
              <img
                src={modalImage.url}
                alt={modalImage.title}
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }}
              />
            </div>

            <div
              style={{
                padding: '12px 20px',
                fontSize: 13,
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{modalImage.title}</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>
                ✓ {modalImage.zones} zone(s) de visage/plaque floutée(s)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
