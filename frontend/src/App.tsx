import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  Flame,
  Landmark,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { CitizenReportForm } from './components/CitizenReportForm';
import { MunicipalDashboard } from './components/MunicipalDashboard';
import { ProtectionCivilePage } from './pages/ProtectionCivilePage';
import { DecideursPage } from './pages/DecideursPage';
import { AuditPage } from './pages/AuditPage';
import { UnifiedAuthPortal } from './components/UnifiedAuthPortal';
import { AuthProvider } from './context/AuthContext';
import { clearActiveSession, getActiveSession } from './services/api';
import { UserSession } from './types';

/**
 * Normalise le rôle de l'utilisateur pour le routage exclusif :
 * 'responsable' | 'citoyen' | 'protection'
 */
function getRoleCategory(role?: string): 'responsable' | 'citoyen' | 'protection' | null {
  if (!role) return null;
  const lower = role.toLowerCase();
  if (lower.includes('responsable') || lower.includes('municipal')) {
    return 'responsable';
  }
  if (lower.includes('citoyen')) {
    return 'citoyen';
  }
  if (lower.includes('protection') || lower.includes('secours') || lower.includes('urgence')) {
    return 'protection';
  }
  return null;
}

/**
 * Barre de navigation minimale affichée EXCLUSIVEMENT en état connecté
 */
interface ConnectedNavBarProps {
  session: UserSession;
  onLogout: () => void;
}

const ConnectedNavBar: React.FC<ConnectedNavBarProps> = ({ session, onLogout }) => {
  const roleCategory = getRoleCategory(session.role);

  const roleMeta = {
    responsable: {
      label: 'Responsable Municipal',
      detail: session.code_arrondissement || session.username,
      icon: Landmark,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.35)',
    },
    citoyen: {
      label: 'Espace Citoyen',
      detail: session.username,
      icon: Users,
      color: '#34d399',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.35)',
    },
    protection: {
      label: 'Protection Civile',
      detail: session.matricule_agent || session.username,
      icon: Flame,
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.35)',
    },
  }[roleCategory || 'citoyen'];

  const RoleIcon = roleMeta.icon;

  return (
    <header
      style={{
        background: 'var(--bg-dark)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Marque & Badge de Rôle Actif */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              borderRadius: 8,
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.4)',
            }}
          >
            SC
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
              SmartCity <span style={{ color: '#38bdf8' }}>Insight AI</span>
            </span>
            <span
              style={{
                marginLeft: 10,
                fontSize: 11,
                fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '2px 8px',
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ShieldCheck size={12} /> INPDP Protected
            </span>
          </div>
        </div>

        {/* Badge distinctif du rôle connecté */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            borderRadius: 20,
            background: roleMeta.bg,
            border: `1px solid ${roleMeta.border}`,
            color: roleMeta.color,
            fontSize: 12.5,
            fontWeight: 700,
            marginLeft: 8,
          }}
        >
          <RoleIcon size={14} />
          <span>{roleMeta.label}</span>
          {roleMeta.detail && (
            <span
              style={{
                opacity: 0.85,
                fontWeight: 500,
                borderLeft: `1px solid ${roleMeta.border}`,
                paddingLeft: 8,
                marginLeft: 2,
              }}
            >
              {roleMeta.detail}
            </span>
          )}
        </div>
      </div>

      {/* Bouton unique : Déconnexion / Retour aux rôles */}
      <button
        type="button"
        onClick={onLogout}
        title="Se déconnecter et retourner au choix des rôles"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 8,
          padding: '8px 14px',
          color: '#fca5a5',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#fca5a5';
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
        }}
      >
        <LogOut size={15} />
        <span>Déconnexion / Retour aux rôles</span>
      </button>
    </header>
  );
};

export const App: React.FC = () => {
  // Session utilisateur active (persiste en localStorage)
  const [session, setSession] = useState<UserSession | null>(() => getActiveSession());

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    clearActiveSession();
    setSession(null);
  };

  const roleCategory = session ? getRoleCategory(session.role) : null;

  // =========================================================================
  // 1. ÉTAT NON CONNECTÉ (PAR DÉFAUT) :
  //    - Aucune barre de navigation supérieure (onglets masqués complètement).
  //    - Affichage exclusif du portail d'authentification par rôles.
  // =========================================================================
  if (!session || !roleCategory) {
    return (
      <AuthProvider>
        <BrowserRouter>
          <div
            style={{
              height: '100vh',
              width: '100vw',
              overflowY: 'auto',
              background: 'var(--bg-darker)',
            }}
          >
            <Routes>
              <Route
                path="*"
                element={<UnifiedAuthPortal onLoginSuccess={handleLoginSuccess} />}
              />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    );
  }

  // =========================================================================
  // 2. ÉTAT CONNECTÉ :
  //    - Barre de navigation minimale (nom + badge rôle + bouton Déconnexion).
  //    - Affichage EXCLUSIF du dashboard correspondant au rôle.
  // =========================================================================
  return (
    <AuthProvider>
      <BrowserRouter>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
          }}
        >
          {/* Barre de navigation minimale sans aucun onglet global */}
          <ConnectedNavBar session={session} onLogout={handleLogout} />

          <main
            style={{
              flex: 1,
              overflowY: 'auto',
              background: 'var(--bg-darker)',
            }}
          >
            <Routes>
              {/* Si rôle 'responsable' -> Afficher MunicipalDashboard */}
              {roleCategory === 'responsable' && (
                <>
                  <Route path="/dashboard" element={<MunicipalDashboard />} />
                  <Route path="/responsable" element={<MunicipalDashboard />} />
                  <Route path="/decideurs" element={<DecideursPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}

              {/* Si rôle 'citoyen' -> Afficher uniquement CitizenReportForm */}
              {roleCategory === 'citoyen' && (
                <>
                  <Route path="/citoyen" element={<CitizenReportForm />} />
                  <Route path="*" element={<Navigate to="/citoyen" replace />} />
                </>
              )}

              {/* Si rôle 'protection' -> Afficher ProtectionCivilePage */}
              {roleCategory === 'protection' && (
                <>
                  <Route path="/protection-civile" element={<ProtectionCivilePage />} />
                  <Route path="/decideurs" element={<DecideursPage />} />
                  <Route path="/audit" element={<AuditPage />} />
                  <Route path="*" element={<Navigate to="/protection-civile" replace />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
