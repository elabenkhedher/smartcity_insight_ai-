import React from 'react';
import {
  X,
  Navigation,
  Car,
  CheckCircle,
  Clock,
  Shield,
  Flame,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { RouteInfo, Caserne } from '../types';

interface RoutePanelProps {
  routeInfo: RouteInfo;
  casernes: Caserne[];
  onSelectCaserne: (caserne: Caserne) => void;
  onClose: () => void;
  onValiderIntervention: () => void;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
  routeInfo,
  casernes,
  onSelectCaserne,
  onClose,
  onValiderIntervention,
}) => {
  const { caserne, alerte, distanceKm, durationMinutes, durationWithTrafficMinutes, trafficDelayMinutes, steps } = routeInfo;

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        bottom: '16px',
        width: '400px',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 500,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
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
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Navigation size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800 }}>ITINÉRAIRE D'URGENCE</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              ROUTES API &bull; CORRIDOR PRIORITAIRE 198
            </div>
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
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Content scrollable */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Metric Cards (Distance & Temps avec trafic) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              DISTANCE ESTIMÉE
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
              {distanceKm.toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>km</span>
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, marginBottom: '4px' }}>
              TEMPS D'ARRIVÉE
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#b91c1c', fontFamily: 'var(--font-mono)' }}>
              ~{durationWithTrafficMinutes || durationMinutes} <span style={{ fontSize: '14px', fontWeight: 500 }}>min</span>
            </div>
            {trafficDelayMinutes && trafficDelayMinutes > 0 && (
              <div style={{ fontSize: '10px', color: '#d97706', marginTop: '2px', fontWeight: 600 }}>
                +{trafficDelayMinutes} min ralentissement trafic
              </div>
            )}
          </div>
        </div>

        {/* Selected Caserne Card */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Caserne d'Attribution :
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                🚒 {caserne.nom}
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  borderRadius: '4px',
                  fontWeight: 700,
                }}
              >
                DISPO
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              📍 {caserne.adresse}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#334155' }}>
              <span>🚑 {caserne.ambulances_disponibles} ambulances</span>
              <span>&bull;</span>
              <span>🚒 {caserne.camions_disponibles} camions</span>
            </div>
          </div>
        </div>

        {/* Destination Alert info */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Lieu de l'Accident :
          </div>
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#b91c1c' }}>
                Alerte #{alerte.id} ({alerte.gravite})
              </span>
              <span style={{ fontSize: '11px', color: '#991b1b', fontFamily: 'var(--font-mono)' }}>
                {alerte.nb_signalements} signalements
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#4c0519', marginTop: '4px', fontWeight: 500 }}>
              📍 {alerte.adresse}
            </div>
          </div>
        </div>

        {/* Turn by turn steps */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Instructions du Corridor d'Urgence :
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {steps.map((st, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '12px',
                  color: '#334155',
                  lineHeight: 1.35,
                }}
              >
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  {idx + 1}
                </span>
                <span>{st}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Action Button */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <button
          onClick={onValiderIntervention}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            border: 'none',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
          }}
        >
          <Flame size={16} />
          <span>ENGAGER LES SECOURS &bull; DÉPART IMMÉDIAT</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};
