import React from 'react';
import {
  Flame,
  Volume2,
  VolumeX,
  Car,
  Cpu,
  Radio,
  Sparkles,
  AlertOctagon,
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
    <div
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
        borderBottom: '1px solid #1e293b',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 16px rgba(239, 68, 68, 0.45)',
            flexShrink: 0,
          }}
        >
          <Flame size={20} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: '#ffffff',
                margin: 0,
                fontFamily: 'var(--font-sans)',
              }}
            >
              CENTRE DE COMMANDEMENT OPÉRATIONNEL (CCO 198)
            </h1>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '9999px',
                padding: '2px 8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
            >
              <AlertOctagon size={12} />
              <span>{activeCount} URGENCE{activeCount > 1 ? 'S' : ''} EN COURS</span>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Direction Générale de la Protection Civile de Tunis &bull; Dispatching d'urgence &lt; 5s
          </div>
        </div>
      </div>

      {/* Action Controls & Telemetry Pills */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        {/* WebSocket Daphne status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: wsConnected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${wsConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: wsConnected ? '#22c55e' : '#ef4444',
              boxShadow: wsConnected ? '0 0 8px #22c55e' : '0 0 8px #ef4444',
            }}
          />
          <Radio size={13} color={wsConnected ? '#4ade80' : '#f87171'} />
          <span style={{ color: wsConnected ? '#86efac' : '#fca5a5', fontWeight: 600 }}>
            {wsConnected ? 'DAPHNE CHANNELS EN DIRECT' : 'WEBSOCKET RECONNEXION'}
          </span>
        </div>

        {/* Sound toggle button */}
        <button
          onClick={onToggleSound}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            backgroundColor: soundEnabled ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${soundEnabled ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            color: soundEnabled ? '#93c5fd' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          title={soundEnabled ? 'Sirène d’urgence activée' : 'Sirène d’urgence coupée'}
        >
          {soundEnabled ? <Volume2 size={15} color="#60a5fa" /> : <VolumeX size={15} color="#94a3b8" />}
          <span>{soundEnabled ? 'SIRÈNE 198 : ACTIVE' : 'SIRÈNE : MUETTE'}</span>
        </button>

        {/* Traffic toggle button */}
        <button
          onClick={onToggleTraffic}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            backgroundColor: trafficLayerActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${trafficLayerActive ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            color: trafficLayerActive ? '#fcd34d' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          title="Prendre en compte le trafic en temps réel dans le calcul d’itinéraire"
        >
          <Car size={15} color={trafficLayerActive ? '#fbbf24' : '#94a3b8'} />
          <span>TRAFIC DIRECT : {trafficLayerActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Risk Map Modal Trigger */}
        <button
          onClick={onOpenRiskMapModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            color: '#c4b5fd',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Cpu size={15} color="#a78bfa" />
          <span>MODÈLE RISK MAP</span>
        </button>

        {/* Simulate Accident Button */}
        <button
          onClick={onSimulateAccident}
          disabled={simulating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: simulating
              ? '#475569'
              : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            color: '#ffffff',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            cursor: simulating ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            letterSpacing: '0.02em',
          }}
        >
          {simulating ? (
            <>
              <Sparkles size={14} className="animate-spin" />
              <span>DÉCLENCHEMENT...</span>
            </>
          ) : (
            <>
              <Flame size={15} />
              <span>SIMULER ACCIDENT (&lt; 5s)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
