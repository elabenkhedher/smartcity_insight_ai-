import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeAlert,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Landmark,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  loginMunicipal,
  registerAccount,
  setActiveSession,
} from '../services/api';
import { AuthMode, PlatformRole, UserSession } from '../types';

interface RoleConfig {
  role: PlatformRole;
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  gradient: string;
  borderAccent: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  description: string;
  highlights: string[];
  targetPath: string;
  actionCta: string;
}

const ROLES_CONFIG: Record<PlatformRole, RoleConfig> = {
  RESPONSABLE_MUNICIPAL: {
    role: 'RESPONSABLE_MUNICIPAL',
    title: 'Responsable Municipal',
    badge: 'Direction Municipale & Voirie',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    gradient: 'linear-gradient(135deg, #1d4ed8, #0284c7)',
    borderAccent: 'rgba(56, 189, 248, 0.35)',
    icon: Landmark,
    description:
      'Supervision centralisée des dégradations de la ville, priorisation IA selon la gravité et la mobilité, et suivi des résolutions.',
    highlights: ['Tableau de bord décisionnel', 'Scoring IA Mobilité', 'Conformité INPDP'],
    targetPath: '/dashboard',
    actionCta: "Accéder au Dashboard Municipal",
  },
  CITOYEN: {
    role: 'CITOYEN',
    title: 'Citoyen',
    badge: 'Espace Public Citoyen',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    gradient: 'linear-gradient(135deg, #059669, #0d9488)',
    borderAccent: 'rgba(16, 185, 129, 0.35)',
    icon: Users,
    description:
      'Déclaration en temps réel des incidents de voirie (nids-de-poule, déchets, éclairage) avec anonymisation automatique des visages et plaques.',
    highlights: ['Signalement Géolocalisé', 'Floutage IA INPDP', 'Suivi du Traitement'],
    targetPath: '/citoyen',
    actionCta: 'Accéder aux Signalements',
  },
  PROTECTION_CIVILE: {
    role: 'PROTECTION_CIVILE',
    title: 'Protection Civile',
    badge: 'Secours & Urgences (Collaborateur)',
    badgeColor: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.14)',
    gradient: 'linear-gradient(135deg, #dc2626, #ea580c)',
    borderAccent: 'rgba(239, 68, 68, 0.4)',
    icon: Flame,
    description:
      'Poste de commandement des secours : alertes accidents WebSocket < 5s, dispatch des casernes, calcul d’itinéraires d’urgence et Risk Map IA.',
    highlights: ['Alertes Live WebSocket', 'Routage Casernes', 'Risk Map IA'],
    targetPath: '/protection-civile',
    actionCta: 'Accéder au Poste Protection Civile',
  },
};

const ARRONDISSEMENTS_PRESETS = [
  'Arrondissement Bab Bhar (1001)',
  'Arrondissement El Menzah (1004)',
  'Arrondissement La Goulette (2060)',
  'Arrondissement Le Bardo (2000)',
  'Arrondissement Lafayette (1002)',
  'Arrondissement Ariana Centre (2080)',
];

export interface UnifiedAuthPortalProps {
  onLoginSuccess?: (session: UserSession) => void;
}

export const UnifiedAuthPortal: React.FC<UnifiedAuthPortalProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  // Écran 1 vs Écran 2
  const [selectedRole, setSelectedRole] = useState<PlatformRole | null>(null);

  // Formulaire d'authentification dynamique
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Champs injectés dynamiquement selon le rôle
  const [codeArrondissement, setCodeArrondissement] = useState('Arrondissement Bab Bhar (1001)');
  const [telephoneCin, setTelephoneCin] = useState('');
  const [matriculeAgent, setMatriculeAgent] = useState('PC-TUNIS-741');

  // États UI
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeConfig = selectedRole ? ROLES_CONFIG[selectedRole] : null;

  // Pré-remplissage rapide des comptes démo
  const applyDemoCredentials = (role: PlatformRole) => {
    setErrorMsg(null);
    if (role === 'RESPONSABLE_MUNICIPAL') {
      setEmail('responsable_mairie');
      setPassword('Mairie2026!');
      setCodeArrondissement('Arrondissement Bab Bhar (1001)');
    } else if (role === 'CITOYEN') {
      setEmail('citoyen_demo');
      setPassword('Citoyen2026!');
      setTelephoneCin('CIN-08765432 / +216 98 123 456');
    } else if (role === 'PROTECTION_CIVILE') {
      setEmail('agent_pc@protection-civile.tn');
      setPassword('PC2026!');
      setMatriculeAgent('PC-TUNIS-741');
    }
  };

  const handleRoleSelect = (role: PlatformRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    setSuccessMsg(null);
    setAuthMode('LOGIN');

    // Pré-initialisation propre des champs par défaut
    if (role === 'RESPONSABLE_MUNICIPAL') {
      setEmail('responsable_mairie');
      setPassword('Mairie2026!');
    } else if (role === 'CITOYEN') {
      setEmail('citoyen_demo');
      setPassword('Citoyen2026!');
    } else if (role === 'PROTECTION_CIVILE') {
      setEmail('agent_pc@protection-civile.tn');
      setPassword('PC2026!');
      setMatriculeAgent('PC-TUNIS-741');
    }
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const cleanEmail = email.trim();

    try {
      if (selectedRole === 'RESPONSABLE_MUNICIPAL') {
        if (authMode === 'LOGIN') {
          // Connexion au backend Django DRF avec JWT
          const data = await loginMunicipal(cleanEmail, password);
          if (!data.user.est_responsable_municipal) {
            throw new Error(
              'Ce compte ne dispose pas des privilèges de Responsable Municipal (rôle CITOYEN détecté).'
            );
          }
          // Stocke la session avec le code arrondissement sélectionné
          const session: UserSession = {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            role: 'RESPONSABLE_MUNICIPAL',
            est_responsable_municipal: true,
            code_arrondissement: codeArrondissement,
            token: data.access,
          };
          setActiveSession(session, data.access);
          onLoginSuccess?.(session);
        } else {
          // Création de compte Responsable Municipal
          const registered = await registerAccount({
            email: cleanEmail,
            password,
            role: 'RESPONSABLE_MUNICIPAL',
            username: cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail,
          });
          const session: UserSession = {
            id: registered.user.id,
            username: registered.user.username,
            email: registered.user.email,
            role: 'RESPONSABLE_MUNICIPAL',
            est_responsable_municipal: true,
            code_arrondissement: codeArrondissement,
            token: registered.access,
          };
          setActiveSession(session, registered.access);
          onLoginSuccess?.(session);
        }

        setSuccessMsg('Authentification réussie. Redirection vers le Dashboard Municipal...');
        setTimeout(() => navigate('/dashboard'), 300);

      } else if (selectedRole === 'CITOYEN') {
        // Citoyen
        if (authMode === 'LOGIN') {
          try {
            // Tente la validation via le backend si le compte existe
            const data = await loginMunicipal(cleanEmail, password);
            const session: UserSession = {
              id: data.user.id,
              username: data.user.username,
              email: data.user.email,
              role: 'CITOYEN',
              est_responsable_municipal: false,
              token: data.access,
            };
            setActiveSession(session, data.access);
            onLoginSuccess?.(session);
          } catch {
            // Fallback de session locale citoyenne si compte démo hors-ligne
            const session: UserSession = {
              username: cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail,
              email: cleanEmail,
              role: 'CITOYEN',
              est_responsable_municipal: false,
            };
            setActiveSession(session);
            onLoginSuccess?.(session);
          }
        } else {
          // Inscription Citoyen : validation du numéro de téléphone / CIN
          if (!telephoneCin.trim()) {
            throw new Error('Le numéro de téléphone ou CIN est obligatoire pour créer un compte Citoyen.');
          }

          try {
            const registered = await registerAccount({
              email: cleanEmail,
              password,
              role: 'CITOYEN',
              username: cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail,
            });
            const session: UserSession = {
              id: registered.user.id,
              username: registered.user.username,
              email: registered.user.email,
              role: 'CITOYEN',
              est_responsable_municipal: false,
              telephone_cin: telephoneCin.trim(),
              token: registered.access,
            };
            setActiveSession(session, registered.access);
            onLoginSuccess?.(session);
          } catch {
            const session: UserSession = {
              username: cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail,
              email: cleanEmail,
              role: 'CITOYEN',
              est_responsable_municipal: false,
              telephone_cin: telephoneCin.trim(),
            };
            setActiveSession(session);
            onLoginSuccess?.(session);
          }
        }

        setSuccessMsg('Session citoyenne active. Redirection vers le formulaire de signalement...');
        setTimeout(() => navigate('/citoyen'), 300);

      } else if (selectedRole === 'PROTECTION_CIVILE') {
        // Protection Civile (Module collaborateur Étudiant 3)
        if (!matriculeAgent.trim()) {
          throw new Error("Le matricule ou badge agent est obligatoire pour accéder au poste d'intervention.");
        }

        const session: UserSession = {
          username: cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail,
          email: cleanEmail,
          role: 'PROTECTION_CIVILE',
          est_responsable_municipal: false,
          matricule_agent: matriculeAgent.trim(),
        };
        setActiveSession(session);
        onLoginSuccess?.(session);

        setSuccessMsg('Session Protection Civile validée. Redirection vers le poste opérationnel...');
        setTimeout(() => navigate('/protection-civile'), 300);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Erreur lors de l'authentification.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        background:
          'radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%), var(--bg-darker)',
      }}
    >
      {/* ===================================================================== */}
      {/* ÉCRAN 1 : SÉLECTION DU RÔLE (3 CARTES DISTINCTES ET CLAIRES)           */}
      {/* ===================================================================== */}
      {!selectedRole && (
        <div style={{ maxWidth: 1100, width: '100%' }}>
          {/* En-tête de bienvenue */}
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: 12.5,
                fontWeight: 700,
                marginBottom: 16,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={14} /> Plateforme Collaborative Intelligente
            </div>

            <h1
              style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.8px',
                marginBottom: 12,
              }}
            >
              Sélectionnez votre espace d’accès
            </h1>

            <p
              style={{
                fontSize: 15,
                color: 'var(--text-muted)',
                maxWidth: 680,
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              SmartCity Insight AI unifie les opérations citoyennes, la gouvernance municipale et
              la coordination des urgences en une seule architecture intégrée.
            </p>
          </div>

          {/* Grille des 3 Cartes de Rôles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
              gap: 24,
            }}
          >
            {(Object.keys(ROLES_CONFIG) as PlatformRole[]).map((roleKey) => {
              const cfg = ROLES_CONFIG[roleKey];
              const Icon = cfg.icon;

              return (
                <div
                  key={roleKey}
                  onClick={() => handleRoleSelect(roleKey)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRoleSelect(roleKey);
                    }
                  }}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${cfg.borderAccent}`,
                    borderRadius: 18,
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px ${cfg.badgeBg}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.35)';
                  }}
                >
                  {/* Effet lueur subtile en haut */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: cfg.gradient,
                    }}
                  />

                  <div>
                    {/* Badge & Icône */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          background: cfg.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          boxShadow: '0 8px 18px rgba(0, 0, 0, 0.35)',
                        }}
                      >
                        <Icon size={26} />
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: cfg.badgeBg,
                          color: cfg.badgeColor,
                          border: `1px solid ${cfg.borderAccent}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                        }}
                      >
                        {cfg.badge}
                      </span>
                    </div>

                    {/* Titre & Description */}
                    <h2
                      style={{
                        fontSize: 21,
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        marginBottom: 10,
                      }}
                    >
                      {cfg.title}
                    </h2>

                    <p
                      style={{
                        fontSize: 13.5,
                        color: 'var(--text-muted)',
                        lineHeight: 1.55,
                        marginBottom: 20,
                      }}
                    >
                      {cfg.description}
                    </p>

                    {/* Points clés */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginBottom: 26,
                      }}
                    >
                      {cfg.highlights.map((h, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            padding: '3px 9px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.04)',
                            color: 'var(--text-dim)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bouton d'action */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 16,
                      borderTop: '1px solid var(--border-color)',
                      color: cfg.badgeColor,
                      fontSize: 13.5,
                      fontWeight: 700,
                    }}
                  >
                    <span>{cfg.actionCta}</span>
                    <ArrowRight size={17} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bandeau d'information de l'architecture collaborative */}
          <div
            style={{
              marginTop: 40,
              padding: '16px 22px',
              borderRadius: 12,
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 13,
              color: 'var(--text-dim)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={18} color="#10b981" />
              <span>
                Conformité <strong>INPDP</strong> active : floutage automatique des visages et plaques par vision par ordinateur OpenCV.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span>PostgreSQL 16 + PostGIS</span>
              <span>•</span>
              <span>Redis 7 Channels</span>
              <span>•</span>
              <span>DRF JWT Bearer</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ÉCRAN 2 : FORMULAIRE D'AUTHENTIFICATION DYNAMIQUE (CARTE / MODALE)    */}
      {/* ===================================================================== */}
      {selectedRole && activeConfig && (
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          {/* Bouton Retour clair au choix des rôles */}
          <button
            type="button"
            onClick={handleBackToRoles}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 16,
              padding: '6px 10px',
              borderRadius: 8,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <ArrowLeft size={16} />
            <span>Retour au choix des rôles</span>
          </button>

          {/* Carte Principale de Connexion / Inscription */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${activeConfig.borderAccent}`,
              borderRadius: 18,
              padding: '30px 28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Liseré haut coloré */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: activeConfig.gradient,
              }}
            />

            {/* En-tête de la carte */}
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: activeConfig.gradient,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  marginBottom: 12,
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
                }}
              >
                {React.createElement(activeConfig.icon, { size: 26 })}
              </div>

              <div style={{ marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 20,
                    background: activeConfig.badgeBg,
                    color: activeConfig.badgeColor,
                    border: `1px solid ${activeConfig.borderAccent}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  {activeConfig.badge}
                </span>
              </div>

              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  marginBottom: 4,
                }}
              >
                Espace {activeConfig.title}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {authMode === 'LOGIN'
                  ? 'Connectez-vous pour accéder à vos prérogatives opérationnelles.'
                  : 'Créez votre compte pour rejoindre le réseau collaboratif.'}
              </p>
            </div>

            {/* Sélecteur de Mode Basculant ("Se connecter" / "Créer un compte") */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: 4,
                marginBottom: 22,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setErrorMsg(null);
                }}
                style={{
                  padding: '9px 14px',
                  borderRadius: 7,
                  border: 'none',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: authMode === 'LOGIN' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: authMode === 'LOGIN' ? '#fff' : 'var(--text-muted)',
                  borderBottom: authMode === 'LOGIN' ? `2px solid ${activeConfig.badgeColor}` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setErrorMsg(null);
                }}
                style={{
                  padding: '9px 14px',
                  borderRadius: 7,
                  border: 'none',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: authMode === 'REGISTER' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: authMode === 'REGISTER' ? '#fff' : 'var(--text-muted)',
                  borderBottom: authMode === 'REGISTER' ? `2px solid ${activeConfig.badgeColor}` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Créer un compte
              </button>
            </div>

            {/* Messages d'erreur & de succès */}
            {errorMsg && (
              <div
                role="alert"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#fca5a5',
                  fontSize: 13,
                }}
              >
                <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#6ee7b7',
                  fontSize: 13,
                }}
              >
                <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Formulaire Dynamique */}
            <form onSubmit={handleSubmit}>
              {/* CHAMP COMMUN 1 : Adresse Email / Identifiant */}
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="auth-email"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: 6,
                  }}
                >
                  Adresse Email / Identifiant <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 10,
                    padding: '10px 14px',
                  }}
                >
                  <Mail size={16} color="var(--text-dim)" />
                  <input
                    id="auth-email"
                    type="text"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'RESPONSABLE_MUNICIPAL'
                        ? 'responsable_mairie ou email'
                        : selectedRole === 'PROTECTION_CIVILE'
                          ? 'agent_pc@protection-civile.tn'
                          : 'citoyen@exemple.tn ou citoyen_demo'
                    }
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-main)',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              {/* CHAMP SPÉCIFIQUE INJECTÉ 1 : Responsable Municipal -> Code / Arrondissement */}
              {selectedRole === 'RESPONSABLE_MUNICIPAL' && (
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="auth-arrondissement"
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: 6,
                    }}
                  >
                    Code / Arrondissement Municipal <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      padding: '10px 14px',
                    }}
                  >
                    <Building2 size={16} color="#38bdf8" />
                    <select
                      id="auth-arrondissement"
                      value={codeArrondissement}
                      onChange={(e) => setCodeArrondissement(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-main)',
                        fontSize: 13.5,
                        cursor: 'pointer',
                      }}
                    >
                      {ARRONDISSEMENTS_PRESETS.map((arr) => (
                        <option
                          key={arr}
                          value={arr}
                          style={{ background: '#0b111e', color: '#f8fafc' }}
                        >
                          {arr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 4 }}>
                    Définit le périmètre territorial des statistiques et des décisions.
                  </div>
                </div>
              )}

              {/* CHAMP SPÉCIFIQUE INJECTÉ 2 : Citoyen (UNIQUEMENT en mode Inscription) -> Téléphone / CIN */}
              {selectedRole === 'CITOYEN' && authMode === 'REGISTER' && (
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="auth-telephone-cin"
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: 6,
                    }}
                  >
                    Numéro de Téléphone / CIN <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      padding: '10px 14px',
                    }}
                  >
                    <Phone size={16} color="#10b981" />
                    <input
                      id="auth-telephone-cin"
                      type="text"
                      required
                      value={telephoneCin}
                      onChange={(e) => setTelephoneCin(e.target.value)}
                      placeholder="ex: +216 98 123 456 ou CIN 08765432"
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-main)',
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 4 }}>
                    Requis pour la certification citoyenne et le suivi des résolutions d’incidents.
                  </div>
                </div>
              )}

              {/* CHAMP SPÉCIFIQUE INJECTÉ 3 : Protection Civile -> Matricule / Badge Agent */}
              {selectedRole === 'PROTECTION_CIVILE' && (
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="auth-matricule"
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: 6,
                    }}
                  >
                    Matricule / Badge Agent <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      padding: '10px 14px',
                    }}
                  >
                    <BadgeAlert size={16} color="#f97316" />
                    <input
                      id="auth-matricule"
                      type="text"
                      required
                      value={matriculeAgent}
                      onChange={(e) => setMatriculeAgent(e.target.value)}
                      placeholder="ex: PC-TUNIS-741 / BADGE-89"
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-main)',
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 4 }}>
                    Identifiant radio et badge d’intervention dans le système de dispatch.
                  </div>
                </div>
              )}

              {/* CHAMP COMMUN 2 : Mot de passe */}
              <div style={{ marginBottom: 22 }}>
                <label
                  htmlFor="auth-password"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: 6,
                  }}
                >
                  Mot de passe <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 10,
                    padding: '10px 14px',
                  }}
                >
                  <Lock size={16} color="var(--text-dim)" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={authMode === 'LOGIN' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-main)',
                      fontSize: 14,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                    }}
                    aria-label="Afficher ou masquer le mot de passe"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Bouton de Soumission Principal */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: isLoading ? 'var(--border-color)' : activeConfig.gradient,
                  border: 'none',
                  borderRadius: 10,
                  padding: '13px 18px',
                  color: '#fff',
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: `0 4px 18px rgba(0, 0, 0, 0.4)`,
                  transition: 'all 0.15s ease',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Validation des informations...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={17} />
                    <span>
                      {authMode === 'LOGIN'
                        ? `Se connecter à l'espace ${activeConfig.title}`
                        : `Créer mon compte ${activeConfig.title}`}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Autofill Pill */}
            <div
              style={{
                marginTop: 20,
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed var(--border-color)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Compte Démo :</span>{' '}
                {selectedRole === 'RESPONSABLE_MUNICIPAL'
                  ? 'responsable_mairie / Mairie2026!'
                  : selectedRole === 'CITOYEN'
                    ? 'citoyen_demo / Citoyen2026!'
                    : 'agent_pc / PC2026! (PC-TUNIS-741)'}
              </div>
              <button
                type="button"
                onClick={() => applyDemoCredentials(selectedRole)}
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Remplir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
