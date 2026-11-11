import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { Role } from '../types';
import { Navbar } from '../components/Navbar';
import {
  Flame,
  Brain,
  ShieldAlert,
  ArrowRight,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<Role>('PROTECTION_CIVILE');
  const [email, setEmail] = useState('y.benamor@protectioncivile.tn');

  const handleRoleQuickSelect = (role: Role) => {
    setSelectedRole(role);
    setEmail(DEMO_ACCOUNTS[role].email);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, selectedRole);
    if (selectedRole === 'PROTECTION_CIVILE') navigate('/protection-civile');
    else if (selectedRole === 'DECIDEUR_MUNICIPAL') navigate('/decideurs');
    else navigate('/audit');
  };

  const roleMeta: Record<
    Role,
    { label: string; icon: any; desc: string; badge: string; color: string }
  > = {
    PROTECTION_CIVILE: {
      label: 'Protection Civile (198)',
      icon: Flame,
      desc: 'Réception des alertes en direct (<5s), dispatching des casernes du Grand Tunis, calcul d’itinéraires d’urgence via Routes API et Risk Map.',
      badge: 'URGENCES < 5s',
      color: '#ef4444',
    },
    DECIDEUR_MUNICIPAL: {
      label: 'Décideur & Assistant LLM',
      icon: Brain,
      desc: 'Cockpit métropolitain, consultation de la Risk Map colorée (vert, orange, rouge) et dialogue avec l’Assistant LLM explicatif (RAG ancré).',
      badge: 'IA & MOBILITÉ',
      color: '#8b5cf6',
    },
    ADMIN_SYSTEME: {
      label: 'Supervision Système & PostGIS',
      icon: ShieldAlert,
      desc: 'Contrôle des flux WebSockets Daphne/Redis, inspection du regroupement spatial PostGIS et journal d’audit immuable horodaté.',
      badge: 'SUPERVISION',
      color: '#3b82f6',
    },
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', position: 'relative' }}>
        {/* Ambient subtle glow */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 80%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            width: '100%',
            maxWidth: '880px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Top banner */}
          <div
            style={{
              padding: '20px 28px',
              background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Lock size={18} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                  PORTAIL SÉCURISÉ &bull; SMARTCITY INSIGHT AI
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>
                  AUTHENTIFICATION OPÉRATIONNELLE
                </div>
              </div>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '4px 10px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '9999px',
                fontWeight: 700,
              }}
            >
              CCO 198 &bull; DÉCIDEURS
            </div>
          </div>

          <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '32px' }}>
            {/* Left Column: Role Selector */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                1. SÉLECTION DU PROFIL OPÉRATIONNEL
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(Object.keys(roleMeta) as Role[]).map((r) => {
                  const meta = roleMeta[r];
                  const Icon = meta.icon;
                  const isSelected = selectedRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleQuickSelect(r)}
                      style={{
                        padding: '14px',
                        border: isSelected ? `2px solid ${meta.color}` : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.03)' : '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon size={16} color={isSelected ? meta.color : '#64748b'} />
                          <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                            {meta.label}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '9px',
                            fontFamily: 'var(--font-mono)',
                            padding: '2px 6px',
                            borderRadius: '9999px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            fontWeight: 700,
                          }}
                        >
                          {meta.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                        {meta.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Credentials Form */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                2. SESSION D'UTILISATEUR PRÉ-CONFIGURÉE
              </div>

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: '#64748b',
                      fontWeight: 600,
                      marginBottom: '6px',
                    }}
                  >
                    IDENTIFIANT PROFESSIONNEL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '13px',
                      backgroundColor: '#f8fafc',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: '#64748b',
                      fontWeight: 600,
                      marginBottom: '6px',
                    }}
                  >
                    CLÉ DE SESSION SÉCURISÉE
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      value="••••••••••••"
                      readOnly
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        backgroundColor: '#f1f5f9',
                        boxSizing: 'border-box',
                      }}
                    />
                    <Lock size={15} style={{ position: 'absolute', right: '14px', top: '14px', color: '#94a3b8' }} />
                  </div>
                </div>

                {/* Identity Card Preview */}
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                        {DEMO_ACCOUNTS[selectedRole].name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {DEMO_ACCOUNTS[selectedRole].title} &bull; {DEMO_ACCOUNTS[selectedRole].department}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '13px 20px',
                    background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                  }}
                >
                  <span>OUVRIR LA SESSION OPÉRATIONNELLE</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
