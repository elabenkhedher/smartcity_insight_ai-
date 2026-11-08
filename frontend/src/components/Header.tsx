import React from 'react';
import {
  Flame,
  Volume2,
  VolumeX,
  Car,
  ShieldAlert,
  Zap,
  Activity,
} from 'lucide-react';

interface HeaderProps {
  wsConnected: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  trafficLayerActive: boolean;
  onToggleTraffic: () => void;
  onOpenRiskMapModal: () => void;
  onSimulateAccident: () => void;
  simulating: boolean;
  activeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  wsConnected,
  soundEnabled,
  onToggleSound,
  trafficLayerActive,
  onToggleTraffic,
  onOpenRiskMapModal,
  onSimulateAccident,
  simulating,
  activeCount,
}) => {
  return (
    <header
      style={{
        backgroundColor: '#090d16',
        borderBottom: '1px solid #1e293b',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 50,
      }}
    >
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#dc2626',
            boxShadow: '0 0 16px rgba(220, 38, 38, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <Flame size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.02em', color: '#f8fafc', margin: 0 }}>
              PROTECTION CIVILE DE TUNIS
            </h1>
            <span
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '4px',
                padding: '2px 7px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.05em',
              }}
            >
              PC-198
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Centre de Commandement Opérationnel & Dispatching des Secours</span>
            <span style={{ color: '#475569' }}>•</span>
            <span style={{ color: '#38bdf8', fontWeight: 500 }}>Grand Tunis</span>
          </p>
        </div>
      </div>

      {/* Center Controls & Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* WebSocket Connection Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: wsConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${wsConnected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            fontSize: '12px',
            fontWeight: 600,
            color: wsConnected ? '#34d399' : '#f87171',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: wsConnected ? '#10b981' : '#ef4444',
              boxShadow: wsConnected ? '0 0 8px #10b981' : '0 0 8px #ef4444',
            }}
          />
          {wsConnected ? 'WebSocket Direct (<5s)' : 'WebSocket Déconnecté'}
        </div>

        {/* Active Emergencies Counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: activeCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.6)',
            border: `1px solid ${activeCount > 0 ? 'rgba(239, 68, 68, 0.4)' : '#334155'}`,
            fontSize: '12px',
            fontWeight: 600,
            color: activeCount > 0 ? '#fca5a5' : '#94a3b8',
          }}
        >
          <Activity size={14} color={activeCount > 0 ? '#ef4444' : '#64748b'} />
          <span>
            {activeCount} incident{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Right Action Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Simuler Accident Action Button */}
        <button
          onClick={onSimulateAccident}
          disabled={simulating}
          style={{
            backgroundColor: '#dc2626',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: simulating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 16px rgba(220, 38, 38, 0.4)',
            transition: 'all 0.2s',
          }}
        >
          <Zap size={15} />
          {simulating ? 'Déclenchement...' : '⚡ Simuler un Accident'}
        </button>

        {/* Traffic Toggle Button */}
        <button
          onClick={onToggleTraffic}
          title="Afficher le trafic routier en direct sur Tunis"
          style={{
            backgroundColor: trafficLayerActive ? 'rgba(16, 185, 129, 0.18)' : '#1e293b',
            border: `1px solid ${trafficLayerActive ? '#10b981' : '#334155'}`,
            borderRadius: '8px',
            padding: '8px 14px',
            color: trafficLayerActive ? '#6ee7b7' : '#cbd5e1',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Car size={15} />
          <span>Trafic Direct</span>
        </button>

        {/* Risk Map IA Button */}
        <button
          onClick={onOpenRiskMapModal}
          title="Évaluer le risque avec le modèle Machine Learning (Random Forest)"
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 14px',
            color: '#cbd5e1',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ShieldAlert size={15} color="#f59e0b" />
          <span>Risk Map IA</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? "Sirène d'alerte activée" : "Sirène d'alerte coupée"}
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 12px',
            color: soundEnabled ? '#38bdf8' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </header>
  );
};
