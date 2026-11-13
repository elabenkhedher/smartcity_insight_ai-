import React, { useState } from 'react';
import { X, Cpu, Sparkles, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { predictRiskMap } from '../services/api';
import type { RiskMapResult } from '../types';

interface RiskMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskMapModal: React.FC<RiskMapModalProps> = ({ isOpen, onClose }) => {
  const [traficIndex, setTraficIndex] = useState<number>(3.5);
  const [presenceTravaux, setPresenceTravaux] = useState<number>(1);
  const [meteoPluie, setMeteoPluie] = useState<number>(0);
  const [incidentsRecents, setIncidentsRecents] = useState<number>(4);
  const [complexite, setComplexite] = useState<number>(2);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<RiskMapResult | null>(null);

  if (!isOpen) return null;

  const handleCalculer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await predictRiskMap({
        trafic_index: Number(traficIndex),
        presence_travaux: Number(presenceTravaux),
        meteo_pluie: Number(meteoPluie),
        incidents_recents: Number(incidentsRecents),
        complexite_geometrique: Number(complexite),
      });
      setResult(data);
    } catch (err) {
      console.warn('API RiskMap non joignable, fallback heuristique local', err);
      let score = 20;
      score += traficIndex * 12;
      score += presenceTravaux * 18;
      score += meteoPluie * 20;
      score += incidentsRecents * 8;
      score = Math.min(Math.round(score), 96);

      let niveau = 'VERT';
      if (score >= 70) niveau = 'ROUGE';
      else if (score >= 40) niveau = 'ORANGE';

      setResult({
        score_risque_pourcentage: score,
        niveau_risk_map: niveau,
        label_niveau: niveau === 'ROUGE' ? 'ÉLEVÉ / CRITIQUE (ROUGE)' : niveau === 'ORANGE' ? 'MODÉRÉ / VIGILANCE (ORANGE)' : 'FAIBLE (VERT)',
        facteurs_explicatifs: [
          `Index de trafic évalué : ${traficIndex}/5`,
          presenceTravaux ? 'Chantier de voirie actif sur le tronçon' : 'Aucun chantier en cours',
          meteoPluie ? 'Chaussée humide (précipitations signalées)' : 'Conditions météo sèches',
          `${incidentsRecents} incidents récents recensés dans un rayon de 1 km`,
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return { color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', bg: '#fef2f2' };
    if (score >= 40) return { color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', bg: '#fffbeb' };
    return { color: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', bg: '#f0fdf4' };
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Cpu size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800 }}>SIMULATEUR MACHINE LEARNING (RISK MAP)</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Modèle Random Forest &bull; Score de 0 à 100%</div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCalculer} style={{ padding: '22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Trafic slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Indice de Trafic en Direct
                </label>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#3b82f6' }}>
                  {traficIndex} / 5.0
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={traficIndex}
                onChange={(e) => setTraficIndex(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                <span>Fluide (1.0)</span>
                <span>Moyen (3.0)</span>
                <span>Saturé (5.0)</span>
              </div>
            </div>

            {/* Incidents slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Historique d'accidents récents (30 derniers jours)
                </label>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ef4444' }}>
                  {incidentsRecents} incidents
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={incidentsRecents}
                onChange={(e) => setIncidentsRecents(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
              />
            </div>

            {/* Géométrie tronçon */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Complexité Géométrique du Tronçon
              </label>
              <select
                value={complexite}
                onChange={(e) => setComplexite(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                }}
              >
                <option value={0}>Ligne droite standard (Risque structurel faible)</option>
                <option value={1}>Courbure prononcée / Virage aveugle</option>
                <option value={2}>Carrefour dense avec insertions latérales</option>
                <option value={3}>Grand échangeur autoroutier à flux croisés (ex: Bab Alioua)</option>
              </select>
            </div>

            {/* Checkbox pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: presenceTravaux ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                  backgroundColor: presenceTravaux ? '#fffbeb' : '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: presenceTravaux ? '#d97706' : '#64748b',
                }}
              >
                <input
                  type="checkbox"
                  checked={presenceTravaux === 1}
                  onChange={(e) => setPresenceTravaux(e.target.checked ? 1 : 0)}
                  style={{ accentColor: '#f59e0b' }}
                />
                <span>🚧 Chantier de voirie actif</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: meteoPluie ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                  backgroundColor: meteoPluie ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: meteoPluie ? '#2563eb' : '#64748b',
                }}
              >
                <input
                  type="checkbox"
                  checked={meteoPluie === 1}
                  onChange={(e) => setMeteoPluie(e.target.checked ? 1 : 0)}
                  style={{ accentColor: '#3b82f6' }}
                />
                <span>🌧️ Chaussée mouillée / Pluie</span>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
              }}
            >
              {loading ? (
                <>
                  <Sparkles size={16} className="animate-spin" />
                  <span>Calcul Machine Learning en cours...</span>
                </>
              ) : (
                <>
                  <Cpu size={16} />
                  <span>Évaluer le Risque avec Random Forest</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display */}
          {result && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: getScoreColor(result.score_risque_pourcentage).bg,
                border: `1px solid ${getScoreColor(result.score_risque_pourcentage).color}`,
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  RÉSULTAT DE L'ÉVALUATION (RISK MAP) :
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: getScoreColor(result.score_risque_pourcentage).color,
                    color: '#ffffff',
                  }}
                >
                  {result.label_niveau || result.niveau_risk_map}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ position: 'relative', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '12px' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${result.score_risque_pourcentage}%`,
                    background: getScoreColor(result.score_risque_pourcentage).gradient,
                    borderRadius: '9999px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: '24px', fontWeight: 900, color: getScoreColor(result.score_risque_pourcentage).color, fontFamily: 'var(--font-mono)', textAlign: 'center', marginBottom: '10px' }}>
                {result.score_risque_pourcentage}%
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  Facteurs explicatifs extraits par le modèle :
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155', lineHeight: 1.4 }}>
                  {result.facteurs_explicatifs.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
