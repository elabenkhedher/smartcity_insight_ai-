import React, { useState } from 'react';
import {
  Navigation,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Users,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Alerte, StatutAlerte } from '../types';

interface AlertsListProps {
  alertes: Alerte[];
  selectedAlerte: Alerte | null;
  onSelectAlerte: (alerte: Alerte) => void;
  onUpdateStatut: (id: number, statut: StatutAlerte) => void;
  onTracerItineraire: (alerte: Alerte) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({
  alertes,
  selectedAlerte,
  onSelectAlerte,
  onUpdateStatut,
  onTracerItineraire,
}) => {
  const [filter, setFilter] = useState<'TOUS' | 'A_TRAITER' | 'EN_COURS' | 'CLOTURE'>('TOUS');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlertes = alertes.filter((a) => {
    if (filter === 'A_TRAITER' && !(a.statut === 'CONFIRME' || a.statut === 'A_CONFIRMER')) {
      return false;
    }
    if (filter === 'EN_COURS' && !(a.statut === 'PRISE_EN_CHARGE' || a.statut === 'EN_INTERVENTION')) {
      return false;
    }
    if (filter === 'CLOTURE' && a.statut !== 'CLOTURE') {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchAddress = a.adresse?.toLowerCase().includes(term);
      const matchId = String(a.id).includes(term);
      const matchGravite = a.gravite?.toLowerCase().includes(term);
      return matchAddress || matchId || matchGravite;
    }
    return true;
  });

  const getGraviteBadge = (gravite: string) => {
    switch (gravite) {
      case 'GRAVE':
        return {
          bg: '#fee2e2',
          color: '#dc2626',
          border: 'rgba(239, 68, 68, 0.4)',
          label: 'GRAVE',
        };
      case 'MOYENNE':
        return {
          bg: '#fef3c7',
          color: '#d97706',
          border: 'rgba(245, 158, 11, 0.4)',
          label: 'MOYENNE',
        };
      default:
        return {
          bg: '#e0f2fe',
          color: '#0284c7',
          border: 'rgba(14, 165, 233, 0.4)',
          label: 'FAIBLE',
        };
    }
  };

  const getStatutBadge = (statut: StatutAlerte) => {
    switch (statut) {
      case 'CONFIRME':
        return { label: 'REÇUE / CONFIRMÉE', bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '#fca5a5' };
      case 'A_CONFIRMER':
        return { label: 'À CONFIRMER (POSTGIS)', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
      case 'PRISE_EN_CHARGE':
        return { label: 'PRISE EN CHARGE', bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '#fcd34d' };
      case 'EN_INTERVENTION':
        return { label: 'EN INTERVENTION', bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '#93c5fd' };
      case 'CLOTURE':
        return { label: 'CLÔTURÉE', bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '#6ee7b7' };
    }
  };

  return (
    <div
      style={{
        width: '420px',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
        zIndex: 20,
      }}
    >
      {/* Top Header of the Alerts Drawer */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={13} />
              <span>FLUX TEMPS RÉEL (&lt; 5s)</span>
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '2px 0 0 0', color: '#0f172a' }}>
              Alertes d'Accidents
            </h2>
          </div>

          <span
            style={{
              padding: '3px 10px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              borderRadius: '9999px',
              fontWeight: 700,
            }}
          >
            {filteredAlertes.length}
          </span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Rechercher par adresse, ID ou gravité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#0f172a',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
          {(
            [
              { key: 'TOUS', label: 'Toutes' },
              { key: 'A_TRAITER', label: 'Reçues' },
              { key: 'EN_COURS', label: 'Actives' },
              { key: 'CLOTURE', label: 'Closes' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '6px 4px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: filter === tab.key ? '#ffffff' : 'transparent',
                color: filter === tab.key ? '#0f172a' : '#64748b',
                fontSize: '11px',
                fontWeight: filter === tab.key ? 700 : 500,
                cursor: 'pointer',
                boxShadow: filter === tab.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List of Alerts */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f8fafc' }}>
        {filteredAlertes.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '12px', color: '#64748b', fontSize: '13px' }}>
            Aucune alerte correspondante aux filtres actuels.
          </div>
        ) : (
          filteredAlertes.map((alerte) => {
            const isSelected = selectedAlerte?.id === alerte.id;
            const graviteBadge = getGraviteBadge(alerte.gravite);
            const statutBadge = getStatutBadge(alerte.statut);
            const isGrave = alerte.gravite === 'GRAVE';

            return (
              <div
                key={alerte.id}
                onClick={() => onSelectAlerte(alerte)}
                style={{
                  padding: '14px',
                  backgroundColor: isSelected ? '#ffffff' : '#ffffff',
                  border: isSelected
                    ? '2px solid #ef4444'
                    : isGrave
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: isSelected
                    ? '0 6px 16px rgba(239, 68, 68, 0.15)'
                    : '0 1px 3px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                }}
              >
                {/* Header of card: ID + Gravité + Statut */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: '#0f172a',
                      }}
                    >
                      #{alerte.id}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: graviteBadge.bg,
                        color: graviteBadge.color,
                        border: `1px solid ${graviteBadge.border}`,
                      }}
                    >
                      {graviteBadge.label}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: statutBadge.bg,
                      color: statutBadge.color,
                      border: `1px solid ${statutBadge.border}`,
                    }}
                  >
                    {statutBadge.label}
                  </span>
                </div>

                {/* Location address */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '8px' }}>
                  <MapPin size={14} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                    {alerte.adresse}
                  </span>
                </div>

                {/* PostGIS concordant reports and time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} color="#3b82f6" />
                    <span>
                      <strong>{alerte.nb_signalements}</strong> concordant{alerte.nb_signalements > 1 ? 's' : ''} (PostGIS)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                    <Clock size={12} />
                    <span>
                      {alerte.date_creation
                        ? new Date(alerte.date_creation).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'En direct'}
                    </span>
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', gap: '6px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                  {/* Route button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTracerItineraire(alerte);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#0f172a',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Navigation size={13} color="#3b82f6" />
                    <span>Itinéraire Routes API</span>
                  </button>

                  {/* Workflow transition button */}
                  {alerte.statut === 'CONFIRME' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatut(alerte.id, 'PRISE_EN_CHARGE');
                      }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Prendre en charge
                    </button>
                  )}

                  {alerte.statut === 'PRISE_EN_CHARGE' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatut(alerte.id, 'EN_INTERVENTION');
                      }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Sur place
                    </button>
                  )}

                  {alerte.statut === 'EN_INTERVENTION' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatut(alerte.id, 'CLOTURE');
                      }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Clôturer
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
