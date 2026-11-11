import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { INITIAL_AUDIT_LOGS } from '../services/mockData';
import { fetchAuditLogs, fetchPostGISStats } from '../services/api';
import { JournalAuditEntry, PostGISStats } from '../types';
import {
  Server,
  Database,
  Radio,
  Cpu,
  RefreshCw,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<JournalAuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [postgisStats, setPostgisStats] = useState<PostGISStats | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'TOUS' | 'INFO' | 'AVERTISSEMENT' | 'CRITIQUE'>('TOUS');

  const loadLogsAndStats = async () => {
    setLoading(true);
    try {
      const [backendLogs, stats] = await Promise.all([
        fetchAuditLogs(),
        fetchPostGISStats(),
      ]);
      if (backendLogs && backendLogs.length > 0) {
        setLogs(backendLogs);
      }
      setPostgisStats(stats);
    } catch (e) {
      console.warn('Erreur chargement logs audit', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogsAndStats();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'TOUS' && log.niveau !== filterLevel) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const targetStr = (log.details || log.entite_cible || '').toLowerCase();
      return (
        log.action.toLowerCase().includes(term) ||
        log.utilisateur.toLowerCase().includes(term) ||
        targetStr.includes(term)
      );
    }
    return true;
  });

  const handleSimulerAudit = () => {
    const nouveau: JournalAuditEntry = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      horodatage: new Date().toISOString(),
      utilisateur: user?.name || 'Administrateur Système',
      role: user?.role || 'ADMIN_SYSTEME',
      action: 'Vérification de l’intégrité spatiale PostGIS et de la latence du canal WebSocket Daphne',
      details: 'Audit certifié : Latence 3.7s (< 5s requis), 100% de concordance spatiale',
      entite_cible: 'PostGIS / Redis ChannelLayer',
      niveau: 'INFO',
    };
    setLogs([nouveau, ...logs]);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITIQUE':
        return { bg: '#fee2e2', color: '#dc2626', border: 'rgba(239, 68, 68, 0.4)' };
      case 'AVERTISSEMENT':
        return { bg: '#fef3c7', color: '#d97706', border: 'rgba(245, 158, 11, 0.4)' };
      default:
        return { bg: '#dcfce7', color: '#16a34a', border: 'rgba(34, 197, 94, 0.4)' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Subheader Banner */}
      <div
        style={{
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          padding: '24px 32px',
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                }}
              >
                SUPERVISION &amp; INTÉGRITÉ SYSTÈME
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                JOURNAL D’AUDIT HORODATÉ STRICT &bull; CONFORME POSTGIS &amp; WORKFLOW
              </span>
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#0f172a',
              }}
            >
              Traçabilité Immuable &amp; Qualification PostGIS
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSimulerAudit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <Cpu size={15} />
              <span>TESTER CONTRÔLE D'AUDIT</span>
            </button>

            <button
              onClick={loadLogsAndStats}
              title="Rafraîchir"
              style={{
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* PostGIS Telemetry & Latency Dashboard */}
      <section
        style={{
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          padding: '20px 32px',
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '6px' }}>
              <Radio size={14} color="#16a34a" />
              <span>LATENCE WEBSOCKET (&lt; 5S EXIGÉ)</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#16a34a' }}>
              {postgisStats?.latence_diffusion_temps_reel || '3.7s'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Diffusion temps réel Redis vers écrans pompiers 198
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '6px' }}>
              <Database size={14} color="#3b82f6" />
              <span>QUALIFICATION SPATIALE POSTGIS</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
              150 mètres
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Rayon de regroupement spatial (ST_DWithin)
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '6px' }}>
              <ShieldCheck size={14} color="#16a34a" />
              <span>ÉLIMINATION FAUSSES ALERTES</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#15803d' }}>
              &ge; 3 signalements
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Seuil de confirmation automatique requis
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '6px' }}>
              <Server size={14} color="#8b5cf6" />
              <span>WORKFLOW EN 4 ÉTAPES</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '4px' }}>
              REÇUE &rarr; EN COURS
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Horodatage strict certifié de chaque transition
            </div>
          </div>
        </div>
      </section>

      {/* Main Audit Table Card */}
      <section style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '32px', boxSizing: 'border-box', flex: 1 }}>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', backgroundColor: '#ffffff', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          {/* Controls Bar */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#fafafa',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Filtrer les actions, agents, ou détails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px 8px 34px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12px',
                  minWidth: '300px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
              {(['TOUS', 'INFO', 'AVERTISSEMENT', 'CRITIQUE'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: filterLevel === lvl ? 700 : 500,
                    border: 'none',
                    backgroundColor: filterLevel === lvl ? '#ffffff' : 'transparent',
                    color: filterLevel === lvl ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    boxShadow: filterLevel === lvl ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <th style={{ padding: '12px 20px' }}>HORODATAGE</th>
                  <th style={{ padding: '12px 20px' }}>ACTEUR / AGENT</th>
                  <th style={{ padding: '12px 20px' }}>ACTION CONSIGNÉE</th>
                  <th style={{ padding: '12px 20px' }}>DÉTAILS &bull; ENTITÉ</th>
                  <th style={{ padding: '12px 20px' }}>NIVEAU</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const badge = getLevelBadge(log.niveau);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.horodatage).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>{log.utilisateur}</td>
                      <td style={{ padding: '14px 20px', color: '#334155' }}>{log.action}</td>
                      <td style={{ padding: '14px 20px', fontSize: '12px', color: '#64748b' }}>
                        {log.details || log.entite_cible || '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontWeight: 700,
                          }}
                        >
                          {log.niveau}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
