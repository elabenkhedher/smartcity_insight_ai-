import React, { useState } from 'react';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Users,
  Navigation,
  CheckCircle,
  Truck,
  Ambulance,
  Search,
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
    // Status filter
    if (filter === 'A_TRAITER' && !(a.statut === 'CONFIRME' || a.statut === 'A_CONFIRMER')) {
      return false;
    }
    if (filter === 'EN_COURS' && !(a.statut === 'PRISE_EN_CHARGE' || a.statut === 'EN_INTERVENTION')) {
      return false;
    }
    if (filter === 'CLOTURE' && a.statut !== 'CLOTURE') {
      return false;
    }
    // Search
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
          bg: 'rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          border: 'rgba(239, 68, 68, 0.4)',
          text: 'URGENCE GRAVE',
        };
      case 'MOYENNE':
        return {
          bg: 'rgba(245, 158, 11, 0.2)',
          color: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.4)',
          text: 'GRAVITÉ MOYENNE',
        };
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.2)',
          color: '#60a5fa',
          border: 'rgba(59, 130, 246, 0.4)',
          text: 'GRAVITÉ FAIBLE',
        };
    }
  };

  const getStatutLabel = (statut: StatutAlerte) => {
    switch (statut) {
      case 'CONFIRME':
        return { label: 'CONFIRMÉ (À TRAITER)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'PRISE_EN_CHARGE':
        return { label: 'PRISE EN CHARGE', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'EN_INTERVENTION':
        return { label: 'EN INTERVENTION', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
      case 'CLOTURE':
        return { label: 'CLÔTURÉ', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
      default:
        return { label: 'À CONFIRMER', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
    }
  };

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return 'Récemment';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0b111e',
        borderRight: '1px solid #1e293b',
        width: '420px',
        minWidth: '380px',
        maxWidth: '440px',
      }}
    >
      {/* Title & Counters */}
      <div style={{ padding: '16px 16px 12px 16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#ef4444" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              File des Incidents & Alertes
            </h2>
          </div>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 600,
            }}
          >
            {filteredAlertes.length} / {alertes.length}
          </span>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#111a2d',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '6px 10px',
            marginBottom: '10px',
          }}
        >
          <Search size={14} color="#64748b" style={{ marginRight: '6px' }} />
          <input
            type="text"
            placeholder="Rechercher par rue, n° alerte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '12px',
              width: '100%',
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'TOUS', label: 'Tous' },
            { id: 'A_TRAITER', label: 'À traiter' },
            { id: 'EN_COURS', label: 'En cours' },
            { id: 'CLOTURE', label: 'Clôturés' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                flex: 1,
                padding: '5px 4px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: filter === tab.id ? 600 : 400,
                backgroundColor: filter === tab.id ? '#1e293b' : 'transparent',
                color: filter === tab.id ? '#38bdf8' : '#94a3b8',
                border: filter === tab.id ? '1px solid #334155' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredAlertes.length === 0 ? (
          <div
            style={{
              padding: '30px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            <p>Aucun incident dans cette catégorie.</p>
            <p style={{ fontSize: '11px', marginTop: '6px' }}>
              Cliquez sur <strong>⚡ Simuler un Accident</strong> en haut pour tester en direct.
            </p>
          </div>
        ) : (
          filteredAlertes.map((alerte) => {
            const isSelected = selectedAlerte?.id === alerte.id;
            const badge = getGraviteBadge(alerte.gravite);
            const statutInfo = getStatutLabel(alerte.statut);
            const isUrgent = alerte.statut === 'CONFIRME';

            return (
              <div
                key={alerte.id}
                onClick={() => {
                  if (alerte.statut !== 'CLOTURE') {
                    onSelectAlerte(alerte);
                  }
                }}
                style={{
                  backgroundColor: isSelected ? '#15223a' : '#0f172a',
                  border: isSelected
                    ? '1.5px solid #38bdf8'
                    : isUrgent
                    ? '1.5px solid #ef4444'
                    : '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: alerte.statut === 'CLOTURE' ? 'default' : 'pointer',
                  opacity: alerte.statut === 'CLOTURE' ? 0.75 : 1,
                  transition: 'all 0.15s',
                  position: 'relative',
                  boxShadow: isUrgent ? '0 0 12px rgba(239, 68, 68, 0.15)' : 'none',
                }}
              >
                {/* Header row: ID + Gravite + Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#f8fafc',
                        fontFamily: 'monospace',
                      }}
                    >
                      #{alerte.id}
                    </span>
                    <span
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}
                    >
                      {badge.text}
                    </span>
                  </div>

                  <span
                    style={{
                      backgroundColor: statutInfo.bg,
                      color: statutInfo.color,
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {statutInfo.label}
                  </span>
                </div>

                {/* Address & Coords */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '8px' }}>
                  <MapPin size={14} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                      {alerte.adresse || 'Tunis Centre'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                      {alerte.latitude.toFixed(4)}, {alerte.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Meta: Concordance & Confirmation Time */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#94a3b8',
                    borderTop: '1px solid #1e293b',
                    paddingTop: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} color="#f59e0b" />
                    <strong>{alerte.nb_signalements}</strong> concordant{alerte.nb_signalements > 1 ? 's' : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {formatTimestamp(alerte.date_confirmation || alerte.date_creation)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {/* Route button : uniquement pour les alertes actives */}
                  {alerte.statut !== 'CLOTURE' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTracerItineraire(alerte);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#2563eb',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '6px 8px',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Navigation size={12} />
                      <span>Tracer Itinéraire ⚡</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '11px',
                        color: '#10b981',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '4px',
                      }}
                    >
                      <CheckCircle size={13} color="#10b981" />
                      <span>Intervention clôturée (retirée de la carte)</span>
                    </div>
                  )}

                  {/* Statut buttons depending on state */}
                  {alerte.statut === 'CONFIRME' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatut(alerte.id, 'PRISE_EN_CHARGE');
                      }}
                      style={{
                        backgroundColor: '#d97706',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '6px 8px',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Ambulance size={12} />
                      <span>Prendre en charge</span>
                    </button>
                  )}

                  {alerte.statut === 'PRISE_EN_CHARGE' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatut(alerte.id, 'EN_INTERVENTION');
                      }}
                      style={{
                        backgroundColor: '#0284c7',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '6px 8px',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Truck size={12} />
                      <span>Déployer Pompiers</span>
                    </button>
                  )}

                  {alerte.statut !== 'CLOTURE' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatut(alerte.id, 'CLOTURE');
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #334155',
                        borderRadius: '5px',
                        padding: '6px 8px',
                        color: '#94a3b8',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle size={12} />
                      <span>Clôturer</span>
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
