import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import {
  Flame,
  Brain,
  ShieldAlert,
  ArrowRight,
  Radio,
  Layers,
  Database,
  CheckCircle,
  Cpu,
  Clock,
  Sparkles,
  Zap,
  Activity,
  MapPin,
  Compass,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero Section with Modern Ambient Glow */}
      <section
        style={{
          position: 'relative',
          padding: '70px 24px 80px 24px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
          borderBottom: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 80%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1380px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '4px 10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '9999px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Flame size={13} />
              <span>CAHIER DES CHARGES ÉTUDIANT 3</span>
            </span>

            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#64748b',
                padding: '4px 8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '9999px',
              }}
            >
              RÉFÉRENT URGENCES &bull; RISK MAP &bull; ASSISTANT LLM &bull; POSTGIS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '48px', alignItems: 'center' }}>
            <div>
              <h1
                style={{
                  fontSize: 'clamp(36px, 4.8vw, 62px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.08,
                  margin: '0 0 20px 0',
                  color: '#0f172a',
                }}
              >
                Système Critique de Gestion des Urgences &amp; Intelligence Avancée.
              </h1>

              <p
                style={{
                  fontSize: '17px',
                  lineHeight: 1.6,
                  color: '#475569',
                  maxWidth: '680px',
                  margin: '0 0 32px 0',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Plateforme temps réel connectant la <strong>Protection Civile de Tunis (&lt; 5s)</strong> via Django
                Channels &amp; Redis, qualification spatiale <strong>PostGIS</strong> de regroupement anti-fausses alertes,
                moteur d'évaluation du risque <strong>Risk Map</strong> (Random Forest) et <strong>Assistant LLM</strong> décisionnel
                à ancrage strict (RAG sans hallucination).
              </p>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                <Link
                  to="/protection-civile"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '12px',
                    boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Flame size={17} />
                  <span>SALLE OPÉRATIONNELLE 198</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to="/decideurs"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 24px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Brain size={17} color="#8b5cf6" />
                  <span>COCKPIT DÉCIDEURS &amp; LLM</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to="/audit"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '12px',
                  }}
                >
                  <ShieldAlert size={16} />
                  <span>JOURNAL D'AUDIT</span>
                </Link>
              </div>
            </div>

            {/* Right Interactive Telemetry Terminal Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0f172a' }}>
                    TÉLÉMÉTRIE DU CAHIER DES CHARGES
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 8px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    borderRadius: '9999px',
                    fontWeight: 700,
                  }}
                >
                  100% OPÉRATIONNEL
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                    <span>⚡ Réactivité Urgence (WebSockets)</span>
                    <span style={{ color: '#16a34a', fontFamily: 'var(--font-mono)' }}>3.7s &bull; Conforme &lt; 5s</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                    Daphne ASGI + Redis Channel Layers vers écrans de secours
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                    <span>🗺️ Qualification Spatiale PostGIS</span>
                    <span style={{ color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>Rayon 150m &bull; Seuil &ge; 3</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                    Regroupement des signalements concordants et élimination fausses alertes
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                    <span>📊 Moteur Machine Learning Risk Map</span>
                    <span style={{ color: '#d97706', fontFamily: 'var(--font-mono)' }}>Random Forest &bull; 0 à 100%</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                    Historique accidents, géométrie tronçons &amp; trafic en direct
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                    <span>🤖 Module API Assistant LLM (RAG)</span>
                    <span style={{ color: '#8b5cf6', fontFamily: 'var(--font-mono)' }}>Zéro Hallucination</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                    Réponses strictement restreintes aux données réelles calculées
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Columns with Modern Card Elevation */}
      <section style={{ maxWidth: '1380px', margin: '0 auto', padding: '60px 24px', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#ef4444', fontWeight: 700, marginBottom: '6px' }}>
            LES LIVRABLES OFFICIELS DU CAHIER DES CHARGES
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Modules Opérationnels Étudiant 3
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Card 1: Urgences */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              }}
            >
              <Flame size={22} />
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#dc2626', fontWeight: 700, marginBottom: '4px' }}>
              PRIORITÉ 1 &bull; BACKEND &amp; FRONTEND
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
              Urgences &lt; 5s &amp; Routes API
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, flex: 1, margin: '0 0 16px 0' }}>
              Architecture WebSockets bidirectionnelle avec <strong>Django Channels &amp; Redis</strong>. Diffusion
              d'alertes d'accident en direct (&lt; 5s), alerte sonore/visuelle, code couleur de gravité et calcul
              d'itinéraire optimal tenant compte du trafic en direct via <strong>Google Routes API</strong>.
            </p>

            <Link
              to="/protection-civile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#dc2626',
                textDecoration: 'none',
              }}
            >
              <span>Accéder à la console 198</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 2: PostGIS */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Database size={22} />
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#d97706', fontWeight: 700, marginBottom: '4px' }}>
              PRIORITÉ 2 &bull; POSTGIS &amp; WORKFLOW
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
              Qualification Spatiale PostGIS
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, flex: 1, margin: '0 0 16px 0' }}>
              Logique spatiale <strong>PostGIS</strong> de regroupement des signalements concordants dans un rayon de{' '}
              <strong>150 mètres</strong> pour éliminer les fausses alertes. Workflow de traitement d'intervention en 4 étapes
              strictes : <em>reçue, prise en charge, en cours, clôturée</em> avec horodatage strict et journal d'audit.
            </p>

            <Link
              to="/audit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#d97706',
                textDecoration: 'none',
              }}
            >
              <span>Consulter l'audit &amp; PostGIS</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 3: Risk Map */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Layers size={22} />
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: 700, marginBottom: '4px' }}>
              PRIORITÉ 3 &bull; MACHINE LEARNING
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
              Moteur Risk Map (Random Forest)
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, flex: 1, margin: '0 0 16px 0' }}>
              Modèle d'évaluation continue du risque routier (score de 0 à 100 %) croisant l'historique d'accidents, la géométrie
              des tronçons et le trafic en temps réel. Visualisation cartographique par zones colorées{' '}
              <strong>(vert, orange, rouge)</strong> et facteurs explicatifs lisibles.
            </p>

            <Link
              to="/decideurs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#2563eb',
                textDecoration: 'none',
              }}
            >
              <span>Visualiser la Risk Map</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 4: Assistant LLM */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              }}
            >
              <Brain size={22} />
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8b5cf6', fontWeight: 700, marginBottom: '4px' }}>
              PRIORITÉ 3 &bull; IA GÉNÉRATIVE / LLM
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
              Assistant LLM Explicatif (RAG)
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, flex: 1, margin: '0 0 16px 0' }}>
              Module API connecté à un LLM avec prompt engineering et RAG strict. Répond aux questions des responsables (ex:{' '}
              <em>"Pourquoi cette zone est-elle risquée ?"</em>) en s'appuyant uniquement sur les données réelles et calculées,{' '}
              <strong>sans invention de faits (zéro hallucination)</strong>.
            </p>

            <Link
              to="/decideurs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#8b5cf6',
                textDecoration: 'none',
              }}
            >
              <span>Dialoguer avec l'Assistant LLM</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          padding: '24px',
          fontSize: '12px',
          color: '#64748b',
        }}
      >
        <div style={{ maxWidth: '1380px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>SmartCity Insight AI</strong> &bull; Plateforme Métropolitaine du Grand Tunis
          </div>
          <div style={{ fontFamily: 'var(--font-mono)' }}>
            Partenaire clé : Protection Civile de Tunis (198) &amp; Décideurs Métropolitains
          </div>
        </div>
      </footer>
    </div>
  );
};
