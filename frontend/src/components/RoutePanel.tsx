import React from 'react';
import {
  Navigation,
  Clock,
  Car,
  MapPin,
  Flame,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import type { RouteInfo, Caserne } from '../types';

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
  const { caserne, alerte, distanceKm, durationMinutes, durationWithTrafficMinutes, trafficDelayMinutes, steps } =
    routeInfo;

  const isDelay = (trafficDelayMinutes || 0) > 1;

  return (
    <div
      style={{
        width: '380px',
        minWidth: '350px',
        maxWidth: '400px',
        height: '100%',
        backgroundColor: '#0b111e',
        borderLeft: '1px solid #1e293b',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '-6px 0 24px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#090e1a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 10px rgba(37, 99, 235, 0.4)',
            }}
          >
            <Navigation size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Itinéraire d'Intervention Rapide
            </h3>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 500 }}>
              Optimisé selon le trafic en direct
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          title="Fermer le panneau d'itinéraire"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* KPI metrics bar: ETA & Distance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* ETA */}
          <div
            style={{
              backgroundColor: '#111a2d',
              border: `1px solid ${isDelay ? '#d97706' : '#059669'}`,
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Clock size={22} color={isDelay ? '#f59e0b' : '#10b981'} />
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: 500 }}>
                Délai estimé
              </span>
              <strong style={{ fontSize: '18px', color: isDelay ? '#fcd34d' : '#34d399', fontWeight: 800 }}>
                {durationWithTrafficMinutes || durationMinutes} min
              </strong>
            </div>
          </div>

          {/* Distance */}
          <div
            style={{
              backgroundColor: '#111a2d',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <MapPin size={22} color="#38bdf8" />
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: 500 }}>
                Distance
              </span>
              <strong style={{ fontSize: '18px', color: '#f8fafc', fontWeight: 800 }}>
                {distanceKm.toFixed(1)} km
              </strong>
            </div>
          </div>
        </div>

        {/* Real-time traffic condition badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: isDelay ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${isDelay ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Car size={15} color={isDelay ? '#f59e0b' : '#10b981'} />
            <span style={{ color: isDelay ? '#fcd34d' : '#6ee7b7', fontWeight: 600 }}>
              {isDelay
                ? `Ralentissement constaté (+${trafficDelayMinutes} min de retard)`
                : 'Trafic fluide sur le trajet'}
            </span>
          </div>
        </div>

        {/* Caserne source selector */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em' }}>
            CASERNE DE DÉPART AFFECTÉE :
          </label>
          <select
            value={caserne.id}
            onChange={(e) => {
              const found = casernes.find((c) => c.id === e.target.value);
              if (found) onSelectCaserne(found);
            }}
            style={{
              width: '100%',
              backgroundColor: '#111a2d',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '8px 10px',
              color: '#f8fafc',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {casernes.map((c) => (
              <option key={c.id} value={c.id}>
                🚒 {c.nom} ({c.ambulances_disponibles} amb., {c.camions_disponibles} cam.)
              </option>
            ))}
          </select>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            📍 {caserne.adresse} • 📞 {caserne.telephone}
          </div>
        </div>

        {/* Target Incident */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em' }}>
            LIEU DE L'INTERVENTION :
          </label>
          <div
            style={{
              backgroundColor: '#111a2d',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ color: '#f87171' }}>Alerte #{alerte.id}</strong>
              <span
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  borderRadius: '4px',
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {alerte.gravite}
              </span>
            </div>
            <div style={{ color: '#cbd5e1', fontWeight: 500 }}>{alerte.adresse}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', fontFamily: 'monospace' }}>
              GPS : {alerte.latitude.toFixed(4)}, {alerte.longitude.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Step-by-step turn instructions */}
        {steps && steps.length > 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em' }}>
              ÉTAPES DE NAVIGATION :
            </label>
            <div
              style={{
                backgroundColor: '#090e1a',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '10px',
                maxHeight: '150px',
                overflowY: 'auto',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {steps.map((st, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    color: '#cbd5e1',
                    lineHeight: 1.4,
                  }}
                >
                  <ChevronRight size={13} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span dangerouslySetInnerHTML={{ __html: st }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dispatch Action Button */}
        <button
          onClick={onValiderIntervention}
          style={{
            marginTop: 'auto',
            width: '100%',
            backgroundColor: '#dc2626',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 0 16px rgba(220, 38, 38, 0.4)',
            transition: 'background-color 0.2s',
          }}
        >
          <Flame size={17} />
          <span>DÉPÊCHER LES SECOURS (198)</span>
        </button>
      </div>
    </div>
  );
};
