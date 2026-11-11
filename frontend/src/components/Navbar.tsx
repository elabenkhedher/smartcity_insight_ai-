import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { Role } from '../types';
import {
  Flame,
  Brain,
  ShieldAlert,
  FileText,
  ChevronDown,
  LogOut,
  LogIn,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Accueil', icon: ShieldAlert },
    { path: '/protection-civile', label: 'Protection Civile (198)', icon: Flame, badge: '< 5s' },
    { path: '/decideurs', label: 'Cockpit Décideurs & LLM', icon: Brain, badge: 'IA / RAG' },
    { path: '/audit', label: 'Journal d’Audit & PostGIS', icon: FileText },
  ];

  const handleSelectRole = (role: Role) => {
    switchRole(role);
    setRoleMenuOpen(false);
    if (role === 'PROTECTION_CIVILE') navigate('/protection-civile');
    else if (role === 'DECIDEUR_MUNICIPAL') navigate('/decideurs');
    else if (role === 'ADMIN_SYSTEME') navigate('/audit');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Top Telemetry / Status Strip */}
      <div
        style={{
          background: 'linear-gradient(90deg, #090d16 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '5px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.02em',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
              <span
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  opacity: 0.75,
                  animation: 'pingRing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
              <span
                style={{
                  position: 'relative',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#16a34a',
                }}
              />
            </span>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>
              TÉLÉMÉTRIE MÉTROPOLITAINE TUNIS : OPÉRATIONNELLE
            </span>
          </div>

          <span style={{ color: '#475569' }}>|</span>

          <span style={{ color: '#94a3b8' }}>
            POSTGIS 3.4 &bull; CHANNELS DAPHNE &bull; REDIS 7 &bull; RANDOM FOREST
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(22, 163, 74, 0.15)',
              padding: '2px 8px',
              borderRadius: '9999px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <Activity size={12} color="#4ade80" />
            <span style={{ color: '#86efac', fontWeight: 600 }}>DIFFUSION &lt; 3.8s (&lt; 5s REQUIS)</span>
          </div>
          <span style={{ color: '#475569' }}>|</span>
          <span style={{ color: '#94a3b8' }}>GRAND TUNIS (36.8065°N, 10.1815°E)</span>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          minHeight: '62px',
        }}
      >
        {/* Brand identity */}
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
              flexShrink: 0,
            }}
          >
            <Flame size={22} />
          </div>

          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>SMARTCITY INSIGHT AI</span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 6px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                v3.8
              </span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: 500,
              }}
            >
              Protection Civile &bull; Risk Map &bull; Assistant LLM Décideurs
            </div>
          </div>
        </Link>

        {/* Navigation items (Modern Pill Tabs) */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
          }}
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#0f172a' : '#64748b',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  borderRadius: '8px',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isActive ? '#ef4444' : '#64748b'} />
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? '#fee2e2' : '#e2e8f0',
                      color: isActive ? '#b91c1c' : '#475569',
                      fontWeight: 700,
                    }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Role Selector & Auth state */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick Role Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#0f172a',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
              title="Changer rapidement de profil opérationnel"
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
                }}
              />
              <span style={{ fontWeight: 600 }}>
                {user ? user.role.replace('_', ' ') : 'NON CONNECTÉ'}
              </span>
              <ChevronDown size={14} color="#64748b" />
            </button>

            {roleMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '8px',
                  width: '330px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                  zIndex: 200,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  PROFIL OPÉRATIONNEL (ÉTUDIANT 3)
                </div>

                <div style={{ padding: '6px' }}>
                  {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((r) => {
                    const acc = DEMO_ACCOUNTS[r];
                    const isCurrent = user?.role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => handleSelectRole(r)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          backgroundColor: isCurrent ? '#f8fafc' : 'transparent',
                          border: isCurrent ? '1px solid #e2e8f0' : '1px solid transparent',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#0f172a',
                          marginBottom: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>
                            {r.replace('_', ' ')}
                          </span>
                          {isCurrent && (
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                color: '#16a34a',
                                fontWeight: 600,
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Actif
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {acc.name} &bull; {acc.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User identification / Login button */}
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '8px',
                  }}
                >
                  {user.avatarInitials}
                </div>
                <div style={{ lineHeight: 1.15 }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>{user.name}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{user.department}</div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Déconnexion"
                style={{
                  padding: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              to="/connexion"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '10px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
              }}
            >
              <LogIn size={14} />
              <span>CONNEXION</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
