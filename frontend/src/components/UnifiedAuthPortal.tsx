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
  borderAccent: string;
  glowColor: string;
  iconBg: string;
  iconColor: string;
  gradientCta: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  description: string;
  highlights: string[];
  actionCta: string;
}

const ROLES_CONFIG: Record<PlatformRole, RoleConfig> = {
  RESPONSABLE_MUNICIPAL: {
    role: 'RESPONSABLE_MUNICIPAL',
    title: 'Responsable Municipal',
    badge: 'Direction Municipale',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.08)',
    borderAccent: 'rgba(56, 189, 248, 0.35)',
    glowColor: 'rgba(56, 189, 248, 0.18)',
    iconBg: 'rgba(56, 189, 248, 0.12)',
    iconColor: '#38bdf8',
    gradientCta: 'linear-gradient(135deg, #0284c7, #2563eb)',
    icon: Landmark,
    description:
      'Supervision centralisée des incidents de voirie, scoring IA d’intervention et pilotage des priorités métropolitaines.',
    highlights: ['Tableau de bord', 'Scoring IA Mobilité', 'Suivi résolutions'],
    actionCta: 'Accéder à l’espace',
  },
  CITOYEN: {
    role: 'CITOYEN',
    title: 'Citoyen',
    badge: 'Espace Citoyen',
    badgeColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.08)',
    borderAccent: 'rgba(16, 185, 129, 0.35)',
    glowColor: 'rgba(16, 185, 129, 0.18)',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    iconColor: '#34d399',
    gradientCta: 'linear-gradient(135deg, #059669, #0d9488)',
    icon: Users,
    description:
      'Signalement géolocalisé des dégradations de chaussée avec anonymisation automatique des visages et plaques certifiée INPDP.',
    highlights: ['Signalement Géolocalisé', 'Floutage IA INPDP', 'Suivi du Traitement'],
    actionCta: 'Accéder à l’espace',
  },
  PROTECTION_CIVILE: {
    role: 'PROTECTION_CIVILE',
    title: 'Protection Civile',
    badge: 'Secours & Urgences',
    badgeColor: '#fb7185',
    badgeBg: 'rgba(244, 63, 94, 0.08)',
    borderAccent: 'rgba(244, 63, 94, 0.35)',
    glowColor: 'rgba(244, 63, 94, 0.18)',
    iconBg: 'rgba(244, 63, 94, 0.12)',
    iconColor: '#fb7185',
    gradientCta: 'linear-gradient(135deg, #e11d48, #ea580c)',
    icon: Flame,
    description:
      'Poste de commandement opérationnel : alertes accidents directes (< 5s), dispatching casernes et cartographie des risques IA.',
    highlights: ['Alertes Live WebSocket', 'Routage Casernes', 'Risk Map IA'],
    actionCta: 'Accéder à l’espace',
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

  // Écran 1 (Sélection du rôle) vs Écran 2 (Formulaire contextuel)
  const [selectedRole, setSelectedRole] = useState<PlatformRole | null>(null);

  // Formulaire d'authentification
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Champs injectés dynamiquement
  const [codeArrondissement, setCodeArrondissement] = useState('Arrondissement Bab Bhar (1001)');
  const [telephoneCin, setTelephoneCin] = useState('');
  const [matriculeAgent, setMatriculeAgent] = useState('PC-TUNIS-741');

  // États UI
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeConfig = selectedRole ? ROLES_CONFIG[selectedRole] : null;

  // Pré-remplissage rapide Démo
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
          const data = await loginMunicipal(cleanEmail, password);
          if (!data.user.est_responsable_municipal) {
            throw new Error(
              'Ce compte ne dispose pas des privilèges de Responsable Municipal (rôle CITOYEN détecté).'
            );
          }
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

        setSuccessMsg('Authentification validée. Redirection vers le Dashboard Municipal...');
        setTimeout(() => navigate('/dashboard'), 300);

      } else if (selectedRole === 'CITOYEN') {
        if (authMode === 'LOGIN') {
          try {
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

        setSuccessMsg('Session citoyenne validée. Redirection vers les signalements...');
        setTimeout(() => navigate('/citoyen'), 300);

      } else if (selectedRole === 'PROTECTION_CIVILE') {
        if (!matriculeAgent.trim()) {
          throw new Error('Le matricule ou badge agent est obligatoire pour accéder au poste.');
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
        'Erreur lors de l’authentification.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        background:
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.9) 60%, #030712 100%)',
        color: '#f8fafc',
      }}
    >
      {/* ===================================================================== */}
      {/* ÉCRAN 1 : SÉLECTION DU RÔLE (3 CARTES ÉPURÉES STYLE PRO & CLEAN)       */}
      {/* ===================================================================== */}
      {!selectedRole && (
        <div style={{ maxWidth: 1040, width: '100%' }}>
          {/* En-tête épuré et moderne */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 38px)',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '-0.03em',
                marginBottom: 12,
                lineHeight: 1.2,
              }}
            >
              Sélectionnez votre espace d’accès
            </h1>

            <p
              style={{
                fontSize: '15px',
                color: '#94a3b8',
                maxWidth: 620,
                margin: '0 auto',
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              Plateforme collaborative unifiant la gouvernance municipale, l’action citoyenne et
              la coordination des secours d’urgence.
            </p>
          </div>

          {/* Grille des 3 Cartes de Rôles (Design Glassmorphism Subtil) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 18,
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = cfg.borderAccent;
                    e.currentTarget.style.boxShadow = `0 20px 35px -10px rgba(0, 0, 0, 0.7), 0 0 25px -5px ${cfg.glowColor}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.5)';
                  }}
                >
                  {/* Liseré haut subtil */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: cfg.gradientCta,
                      opacity: 0.85,
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
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: cfg.iconBg,
                          border: `1px solid ${cfg.borderAccent}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: cfg.iconColor,
                        }}
                      >
                        <Icon size={22} />
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: cfg.badgeBg,
                          color: cfg.badgeColor,
                          border: `1px solid ${cfg.borderAccent}`,
                          letterSpacing: '0.3px',
                        }}
                      >
                        {cfg.badge}
                      </span>
                    </div>

                    {/* Titre & Description */}
                    <h2
                      style={{
                        fontSize: 19,
                        fontWeight: 700,
                        color: '#f8fafc',
                        letterSpacing: '-0.02em',
                        marginBottom: 10,
                      }}
                    >
                      {cfg.title}
                    </h2>

                    <p
                      style={{
                        fontSize: 13.5,
                        color: '#94a3b8',
                        lineHeight: 1.55,
                        marginBottom: 22,
                        minHeight: 42,
                      }}
                    >
                      {cfg.description}
                    </p>

                    {/* Points clés épurés */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginBottom: 24,
                      }}
                    >
                      {cfg.highlights.map((h, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 11.5,
                            fontWeight: 500,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.04)',
                            color: '#cbd5e1',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bouton d'action épuré */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 16,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      color: cfg.badgeColor,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <span>{cfg.actionCta}</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ÉCRAN 2 : FORMULAIRE D'AUTHENTIFICATION DYNAMIQUE (CARTE MODERNE)     */}
      {/* ===================================================================== */}
      {selectedRole && activeConfig && (
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          {/* Bouton Retour élégant */}
          <button
            type="button"
            onClick={handleBackToRoles}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: 16,
              padding: '6px 8px',
              borderRadius: 8,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <ArrowLeft size={15} />
            <span>Retour au choix des rôles</span>
          </button>

          {/* Carte Principale de Connexion / Inscription */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              padding: '32px 28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
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
                height: 2,
                background: activeConfig.gradientCta,
              }}
            />

            {/* En-tête de la carte */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: activeConfig.iconBg,
                  border: `1px solid ${activeConfig.borderAccent}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeConfig.iconColor,
                  marginBottom: 12,
                }}
              >
                {React.createElement(activeConfig.icon, { size: 22 })}
              </div>

              <div style={{ marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: activeConfig.badgeBg,
                    color: activeConfig.badgeColor,
                    border: `1px solid ${activeConfig.borderAccent}`,
                    letterSpacing: '0.3px',
                  }}
                >
                  {activeConfig.badge}
                </span>
              </div>

              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#f8fafc',
                  letterSpacing: '-0.02em',
                  marginBottom: 4,
                }}
              >
                Espace {activeConfig.title}
              </h2>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                {authMode === 'LOGIN'
                  ? 'Connectez-vous pour accéder à vos prérogatives opérationnelles.'
                  : 'Créez votre compte pour rejoindre le réseau collaboratif.'}
              </p>
            </div>

            {/* Sélecteur de Mode Basculant (Style Segmented Control Pro) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: 'rgba(2, 6, 23, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                padding: 3,
                marginBottom: 20,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setErrorMsg(null);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 7,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: authMode === 'LOGIN' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: authMode === 'LOGIN' ? '#f8fafc' : '#94a3b8',
                  boxShadow: authMode === 'LOGIN' ? '0 1px 4px rgba(0, 0, 0, 0.3)' : 'none',
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
                  padding: '8px 12px',
                  borderRadius: 7,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: authMode === 'REGISTER' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: authMode === 'REGISTER' ? '#f8fafc' : '#94a3b8',
                  boxShadow: authMode === 'REGISTER' ? '0 1px 4px rgba(0, 0, 0, 0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Créer un compte
              </button>
            </div>

            {/* Alertes d'Erreur & de Succès */}
            {errorMsg && (
              <div
                role="alert"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#fca5a5',
                  fontSize: 12.5,
                }}
              >
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#6ee7b7',
                  fontSize: 12.5,
                }}
              >
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Formulaire Dynamique */}
            <form onSubmit={handleSubmit}>
              {/* CHAMP 1 : Adresse Email / Identifiant */}
              <div style={{ marginBottom: 15 }}>
                <label
                  htmlFor="auth-email"
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: 5,
                  }}
                >
                  Adresse Email / Identifiant
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(2, 6, 23, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    padding: '9px 12px',
                  }}
                >
                  <Mail size={15} color="#64748b" />
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
                      color: '#f8fafc',
                      fontSize: 13.5,
                    }}
                  />
                </div>
              </div>

              {/* CHAMP SPÉCIFIQUE 1 : Responsable Municipal -> Arrondissement */}
              {selectedRole === 'RESPONSABLE_MUNICIPAL' && (
                <div style={{ marginBottom: 15 }}>
                  <label
                    htmlFor="auth-arrondissement"
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#e2e8f0',
                      marginBottom: 5,
                    }}
                  >
                    Code / Arrondissement Municipal
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'rgba(2, 6, 23, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 10,
                      padding: '9px 12px',
                    }}
                  >
                    <Building2 size={15} color="#38bdf8" />
                    <select
                      id="auth-arrondissement"
                      value={codeArrondissement}
                      onChange={(e) => setCodeArrondissement(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#f8fafc',
                        fontSize: 13,
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
                </div>
              )}

              {/* CHAMP SPÉCIFIQUE 2 : Citoyen (uniquement Inscription) -> Téléphone / CIN */}
              {selectedRole === 'CITOYEN' && authMode === 'REGISTER' && (
                <div style={{ marginBottom: 15 }}>
                  <label
                    htmlFor="auth-telephone-cin"
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#e2e8f0',
                      marginBottom: 5,
                    }}
                  >
                    Numéro de Téléphone / CIN
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'rgba(2, 6, 23, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 10,
                      padding: '9px 12px',
                    }}
                  >
                    <Phone size={15} color="#34d399" />
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
                        color: '#f8fafc',
                        fontSize: 13.5,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* CHAMP SPÉCIFIQUE 3 : Protection Civile -> Matricule */}
              {selectedRole === 'PROTECTION_CIVILE' && (
                <div style={{ marginBottom: 15 }}>
                  <label
                    htmlFor="auth-matricule"
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#e2e8f0',
                      marginBottom: 5,
                    }}
                  >
                    Matricule / Badge Agent
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'rgba(2, 6, 23, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 10,
                      padding: '9px 12px',
                    }}
                  >
                    <BadgeAlert size={15} color="#fb7185" />
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
                        color: '#f8fafc',
                        fontSize: 13.5,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* CHAMP 2 : Mot de passe */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="auth-password"
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: 5,
                  }}
                >
                  Mot de passe
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(2, 6, 23, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    padding: '9px 12px',
                  }}
                >
                  <Lock size={15} color="#64748b" />
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
                      color: '#f8fafc',
                      fontSize: 13.5,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                    }}
                    aria-label="Afficher ou masquer le mot de passe"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Bouton de Soumission */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: isLoading ? 'rgba(51, 65, 85, 0.6)' : activeConfig.gradientCta,
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Validation...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>
                      {authMode === 'LOGIN'
                        ? `Se connecter à l’espace ${activeConfig.title}`
                        : `Créer mon compte ${activeConfig.title}`}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Autofill Pill épuré */}
            <div
              style={{
                marginTop: 18,
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: '#94a3b8',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Démo :</span>{' '}
                {selectedRole === 'RESPONSABLE_MUNICIPAL'
                  ? 'responsable_mairie / Mairie2026!'
                  : selectedRole === 'CITOYEN'
                    ? 'citoyen_demo / Citoyen2026!'
                    : 'agent_pc / PC2026!'}
              </div>
              <button
                type="button"
                onClick={() => applyDemoCredentials(selectedRole)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '3px 7px',
                  borderRadius: 5,
                  fontSize: 11,
                  fontWeight: 600,
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
