import React, { useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { loginMunicipal } from '../services/api';
import { AuthUser } from '../types';

interface MunicipalLoginProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const MunicipalLogin: React.FC<MunicipalLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const data = await loginMunicipal(username.trim(), password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setErrorMsg("Nom d'utilisateur ou mot de passe invalide.");
      } else if (status === 403) {
        setErrorMsg(
          err?.response?.data?.detail ||
            'Accès refusé pour ce compte.'
        );
      } else {
        setErrorMsg(
          err?.response?.data?.detail ||
            'Impossible de joindre le serveur d’authentification Django.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(6, 182, 212, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <ShieldCheck size={28} color="#38bdf8" />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: 6,
            }}
          >
            Espace Responsable Municipal
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Authentification requise par jeton JWT Bearer pour accéder aux statistiques globales
            et au pilotage des interventions.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            style={{
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 20,
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="municipal-username"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: 6,
              }}
            >
              Identifiant
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
              <User size={16} color="var(--text-dim)" />
              <input
                id="municipal-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: responsable_mairie"
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

          <div style={{ marginBottom: 22 }}>
            <label
              htmlFor="municipal-password"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: 6,
              }}
            >
              Mot de passe
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
                id="municipal-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
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

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading
                ? 'var(--border-color)'
                : 'linear-gradient(135deg, #2563eb, #0284c7)',
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
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Vérification des droits...</span>
              </>
            ) : (
              <>
                <KeyRound size={17} />
                <span>Se connecter au Pilotage</span>
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--border-color)',
            fontSize: 12,
            color: 'var(--text-dim)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Accès strictement contrôlé par rôle (RBAC : <code>RESPONSABLE_MUNICIPAL</code>).
          Les comptes citoyens sont automatiquement bloqués (HTTP 403).
        </div>
      </div>
    </div>
  );
};
