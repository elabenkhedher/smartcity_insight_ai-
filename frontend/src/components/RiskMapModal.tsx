import React, { useState } from 'react';
import { ShieldAlert, X, Activity, CloudRain, Construction, AlertTriangle } from 'lucide-react';
import { predictRiskMap } from '../services/api';
import { RiskMapResult } from '../types';

interface RiskMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskMapModal: React.FC<RiskMapModalProps> = ({ isOpen, onClose }) => {
  const [traficIndex, setTraficIndex] = useState(2.8);
  const [presenceTravaux, setPresenceTravaux] = useState(1);
  const [meteoPluie, setMeteoPluie] = useState(0);
  const [incidentsRecents, setIncidentsRecents] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskMapResult | null>(null);

  if (!isOpen) return null;

  const handlePredict = async () => {
    setLoading(true);
    try {
      const data = await predictRiskMap({
        trafic_index: traficIndex,
        presence_travaux: presenceTravaux,
        meteo_pluie: meteoPluie,
        incidents_recents: incidentsRecents,
      });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#ef4444';
    if (score >= 40) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
                Risk Map IA - Random Forest Predictor
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Algorithme prédictif du risque routier sur Tunis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sliders Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={15} color="#38bdf8" /> Indice de Trafic (1.0 = fluide, 5.0 = congestion sévère)
              </span>
              <strong style={{ color: '#38bdf8' }}>{traficIndex.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={traficIndex}
              onChange={(e) => setTraficIndex(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Construction size={15} color="#f59e0b" /> Présence de travaux routiers ou chantiers
              </span>
              <strong style={{ color: '#f59e0b' }}>{presenceTravaux === 1 ? 'OUI' : 'NON'}</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setPresenceTravaux(0)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: presenceTravaux === 0 ? '#1e293b' : 'transparent',
                  color: presenceTravaux === 0 ? '#38bdf8' : '#94a3b8',
                  fontWeight: presenceTravaux === 0 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                Non
              </button>
              <button
                onClick={() => setPresenceTravaux(1)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: presenceTravaux === 1 ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: presenceTravaux === 1 ? '#fcd34d' : '#94a3b8',
                  fontWeight: presenceTravaux === 1 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                Oui (Chantiers)
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CloudRain size={15} color="#60a5fa" /> Météo Pluvieuse
              </span>
              <strong style={{ color: '#60a5fa' }}>{meteoPluie === 1 ? 'OUI' : 'NON'}</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setMeteoPluie(0)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: meteoPluie === 0 ? '#1e293b' : 'transparent',
                  color: meteoPluie === 0 ? '#38bdf8' : '#94a3b8',
                  fontWeight: meteoPluie === 0 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                Sec / Beau temps
              </button>
              <button
                onClick={() => setMeteoPluie(1)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: meteoPluie === 1 ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                  color: meteoPluie === 1 ? '#93c5fd' : '#94a3b8',
                  fontWeight: meteoPluie === 1 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                Pluie / Chaussée glissante
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} color="#ef4444" /> Incidents ou signalements récents (dernières heures)
              </span>
              <strong style={{ color: '#ef4444' }}>{incidentsRecents}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={incidentsRecents}
              onChange={(e) => setIncidentsRecents(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#ef4444' }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePredict}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '8px',
            padding: '11px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginBottom: '18px',
          }}
        >
          {loading ? 'Calcul en cours par le modèle IA...' : '⚡ Évaluer le Risque de la Zone'}
        </button>

        {/* Prediction Results */}
        {result && (
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${getScoreColor(result.score_risque_pourcentage)}`,
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Score de risque calculé :</span>
                <div style={{ fontSize: '26px', fontWeight: 800, color: getScoreColor(result.score_risque_pourcentage) }}>
                  {result.score_risque_pourcentage} %
                </div>
              </div>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: `${getScoreColor(result.score_risque_pourcentage)}22`,
                  color: getScoreColor(result.score_risque_pourcentage),
                  fontWeight: 700,
                  fontSize: '13px',
                  border: `1px solid ${getScoreColor(result.score_risque_pourcentage)}`,
                }}
              >
                {result.niveau_risk_map}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                Facteurs explicatifs déterminés par le Random Forest :
              </span>
              <ul style={{ paddingLeft: '18px', margin: '6px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                {result.facteurs_explicatifs.map((f, idx) => (
                  <li key={idx} style={{ color: '#e2e8f0', marginBottom: '2px' }}>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
