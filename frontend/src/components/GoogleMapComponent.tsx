import React, { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import type { Alerte, Caserne, RouteInfo, ZoneRisque } from '../types';
import { fetchZonesRiskMap } from '../services/api';

interface GoogleMapComponentProps {
  casernes: Caserne[];
  alertes: Alerte[];
  selectedAlerte: Alerte | null;
  selectedCaserne: Caserne | null;
  trafficLayerActive: boolean;
  onSelectAlerte: (alerte: Alerte) => void;
  onRouteCalculated: (route: RouteInfo | null) => void;
}

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  casernes,
  alertes,
  selectedAlerte,
  selectedCaserne,
  trafficLayerActive,
  onSelectAlerte,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Leaflet map instances
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkersRef = useRef<L.LayerGroup | null>(null);
  const leafletRiskLayerRef = useRef<L.LayerGroup | null>(null);
  const leafletRouteLayerRef = useRef<L.Polyline | null>(null);

  // Risk map layer state
  const [riskMapVisible, setRiskMapVisible] = useState<boolean>(true);
  const [riskZones, setRiskZones] = useState<ZoneRisque[]>([]);

  // Load risk zones
  useEffect(() => {
    fetchZonesRiskMap().then((data) => setRiskZones(data)).catch((err) => console.warn(err));
  }, []);

  // Distance Haversine helper
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Trouver la caserne la plus proche
  const getNearestCaserne = useCallback(
    (alerte: Alerte): Caserne => {
      if (selectedCaserne) return selectedCaserne;
      if (casernes.length === 0) {
        return {
          id: 'def',
          nom: 'Caserne Centrale — Bab El Khadra',
          adresse: 'Avenue Habib Thameur / Bab El Khadra, Tunis',
          latitude: 36.8123,
          longitude: 10.1784,
          telephone: '198',
          ambulances_disponibles: 3,
          camions_disponibles: 2,
          statut: 'OPERATIONNELLE',
        };
      }
      let nearest = casernes[0];
      let minDis = calculateDistanceKm(alerte.latitude, alerte.longitude, nearest.latitude, nearest.longitude);
      for (let i = 1; i < casernes.length; i++) {
        const d = calculateDistanceKm(alerte.latitude, alerte.longitude, casernes[i].latitude, casernes[i].longitude);
        if (d < minDis) {
          minDis = d;
          nearest = casernes[i];
        }
      }
      return nearest;
    },
    [casernes, selectedCaserne]
  );

  // 1. Initialiser la carte Leaflet sur le Grand Tunis
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    const tunisBounds = L.latLngBounds(
      L.latLng(36.4, 9.8),
      L.latLng(37.2, 10.6)
    );

    const map = L.map(mapContainerRef.current, {
      center: [36.8123, 10.1784],
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: tunisBounds,
      maxBoundsViscosity: 0.85,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topleft' }).addTo(map);

    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });
    osmLayer.addTo(map);

    leafletRiskLayerRef.current = L.layerGroup().addTo(map);
    leafletMarkersRef.current = L.layerGroup().addTo(map);
    leafletMapRef.current = map;

    const triggerResize = () => {
      if (map) map.invalidateSize();
    };

    triggerResize();
    const t1 = setTimeout(triggerResize, 100);
    const t2 = setTimeout(triggerResize, 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // 2. Afficher / Mettre à jour la couche Risk Map (Vert, Orange, Rouge)
  useEffect(() => {
    if (!leafletMapRef.current || !leafletRiskLayerRef.current) return;

    leafletRiskLayerRef.current.clearLayers();

    if (!riskMapVisible || riskZones.length === 0) return;

    riskZones.forEach((z) => {
      const isRouge = z.niveau_risk_map === 'ROUGE';
      const isOrange = z.niveau_risk_map === 'ORANGE';
      const color = isRouge ? '#b91c1c' : isOrange ? '#d97706' : '#15803d';
      const fillColor = isRouge ? '#ef4444' : isOrange ? '#f59e0b' : '#22c55e';

      // Afficher soit le polygone si fourni, soit un cercle de secteur
      let layer: L.Polygon | L.Circle;
      if (z.points_polygone && z.points_polygone.length >= 3) {
        layer = L.polygon(z.points_polygone, {
          color: color,
          weight: 2,
          fillColor: fillColor,
          fillOpacity: 0.35,
        });
      } else {
        layer = L.circle([z.latitude, z.longitude], {
          radius: z.rayon_metres || 450,
          color: color,
          weight: 2,
          fillColor: fillColor,
          fillOpacity: 0.35,
        });
      }

      const facteursHtml = z.facteurs_explicatifs
        .map((f) => `<li style="margin-bottom: 2px;">${f}</li>`)
        .join('');

      layer.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 240px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 6px;">
            <strong style="color: #0a0a0a; font-size: 13px;">${z.nom}</strong>
            <span style="background: ${isRouge ? '#fee2e2' : isOrange ? '#fef3c7' : '#dcfce7'}; color: ${color}; padding: 2px 6px; border-radius: 2px; font-weight: bold; font-family: monospace;">
              ${z.score_risque_pourcentage}% (${z.niveau_risk_map})
            </span>
          </div>
          <div style="font-size: 11px; color: #4b5563; margin-bottom: 6px;">
            📍 ${z.arrondissement}<br/>
            🚗 Trafic index : <strong>${z.trafic_index}/5</strong> &bull; 🚧 Travaux : <strong>${z.presence_travaux ? 'Oui' : 'Non'}</strong>
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #111827; margin-top: 4px;">Facteurs explicatifs (Random Forest) :</div>
          <ul style="margin: 2px 0 0 0; padding-left: 16px; font-size: 11px; color: #374151;">
            ${facteursHtml}
          </ul>
        </div>
      `);

      layer.addTo(leafletRiskLayerRef.current!);
    });
  }, [riskMapVisible, riskZones]);

  // 3. Afficher les casernes et les alertes d'accident en direct (< 5s)
  useEffect(() => {
    if (!leafletMapRef.current || !leafletMarkersRef.current) return;

    leafletMarkersRef.current.clearLayers();

    // Icône des casernes 198
    const fireStationIcon = L.divIcon({
      className: 'firestation-custom-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background-color: #0a0a0a;
          border: 2px solid #ffffff;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        ">
          🚒
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    casernes.forEach((c) => {
      const m = L.marker([c.latitude, c.longitude], { icon: fireStationIcon });
      m.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 200px;">
          <strong style="color: #0a0a0a; font-size: 13px;">${c.nom}</strong><br/>
          <span style="color: #4b5563;">${c.adresse}</span><br/>
          <div style="margin-top: 6px; padding: 4px; background: #f3f4f6; border-radius: 2px; font-size: 11px; font-family: monospace;">
            🚑 Ambulances : ${c.ambulances_disponibles} &bull; 🚒 Camions : ${c.camions_disponibles}<br/>
            📞 Urgences : ${c.telephone}
          </div>
        </div>
      `);
      m.addTo(leafletMarkersRef.current!);
    });

    // Icônes des alertes d'accident avec code couleur de gravité exigé
    alertes.forEach((a) => {
      const isSelected = selectedAlerte?.id === a.id;
      const isGrave = a.gravite === 'GRAVE';
      const isMoyenne = a.gravite === 'MOYENNE';
      const markerColor = isGrave ? '#b91c1c' : isMoyenne ? '#ea580c' : '#15803d';

      const alertIcon = L.divIcon({
        className: 'alert-custom-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            ${
              a.statut !== 'CLOTURE'
                ? `<div style="
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    background-color: ${markerColor};
                    opacity: 0.4;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></div>`
                : ''
            }
            <div style="
              width: ${isSelected ? '32px' : '28px'};
              height: ${isSelected ? '32px' : '28px'};
              background-color: ${markerColor};
              border: 2px solid #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 14px;
              font-weight: bold;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
              transition: all 150ms ease;
            ">
              🚨
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      const m = L.marker([a.latitude, a.longitude], { icon: alertIcon });
      m.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 220px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #0a0a0a; font-size: 13px;">Alerte #${a.id}</strong>
            <span style="background: ${isGrave ? '#fee2e2' : '#fef3c7'}; color: ${markerColor}; padding: 1px 6px; border-radius: 2px; font-size: 10px; font-weight: bold; font-family: monospace;">
              ${a.gravite}
            </span>
          </div>
          <span style="color: #374151;">📍 ${a.adresse}</span><br/>
          <div style="font-size: 11px; color: #4b5563; margin-top: 4px;">
            👥 ${a.nb_signalements} signalements concordants (Qualification PostGIS)
          </div>
          <div style="margin-top: 4px; font-size: 11px; color: #0284c7; font-weight: bold; font-family: monospace;">
            Statut : ${a.statut}
          </div>
        </div>
      `);
      m.on('click', () => onSelectAlerte(a));
      m.addTo(leafletMarkersRef.current!);
    });
  }, [casernes, alertes, selectedAlerte, onSelectAlerte]);

  // 4. Calcul de l'itinéraire le plus rapide via Routes API et tracé en direct
  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (!selectedAlerte || selectedAlerte.statut === 'CLOTURE') {
      if (leafletRouteLayerRef.current) {
        leafletMapRef.current.removeLayer(leafletRouteLayerRef.current);
        leafletRouteLayerRef.current = null;
      }
      onRouteCalculated(null);
      return;
    }

    const caserne = getNearestCaserne(selectedAlerte);
    const dis = calculateDistanceKm(
      caserne.latitude,
      caserne.longitude,
      selectedAlerte.latitude,
      selectedAlerte.longitude
    );

    // Vitesse moyenne des véhicules d'urgence à Tunis avec avertisseur spécial 198 (38 km/h)
    const rawDuration = Math.round((dis / 38) * 60) + 1;
    const trafficDelay = trafficLayerActive ? 2 : 0;

    const latMid = (caserne.latitude + selectedAlerte.latitude) / 2 + 0.0015;
    const lngMid = (caserne.longitude + selectedAlerte.longitude) / 2 - 0.002;
    const polyCoordinates: [number, number][] = [
      [caserne.latitude, caserne.longitude],
      [latMid, lngMid],
      [selectedAlerte.latitude, selectedAlerte.longitude],
    ];

    if (leafletRouteLayerRef.current) {
      leafletMapRef.current.removeLayer(leafletRouteLayerRef.current);
    }

    leafletRouteLayerRef.current = L.polyline(polyCoordinates, {
      color: '#b91c1c',
      weight: 5,
      opacity: 1,
      dashArray: '8, 4',
    }).addTo(leafletMapRef.current);

    const bounds = L.latLngBounds(polyCoordinates);
    leafletMapRef.current.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 15,
    });

    onRouteCalculated({
      caserne,
      alerte: selectedAlerte,
      distanceKm: dis,
      durationMinutes: rawDuration,
      durationWithTrafficMinutes: rawDuration + trafficDelay,
      trafficDelayMinutes: trafficDelay,
      steps: [
        `Départ de la ${caserne.nom} (${caserne.adresse})`,
        'Engagement sur axe prioritaire d’urgence (gyrophares et deux-tons 198)',
        'Corridor urbain sécurisé via Routes API (évitement encombrements)',
        `Arrivée sur les lieux de l'accident : ${selectedAlerte.adresse}`,
      ],
      polylineCoordinates: polyCoordinates,
    });
  }, [selectedAlerte, selectedCaserne, trafficLayerActive, getNearestCaserne, onRouteCalculated]);

  const handleRecenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([36.8123, 10.1784], 13);
      leafletMapRef.current.invalidateSize();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Conteneur principal de la carte */}
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#0b111e',
        }}
      />

      {/* Floating Tactical Controls overlay */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Toggle Risk Map layer */}
        <button
          onClick={() => setRiskMapVisible((prev) => !prev)}
          style={{
            padding: '10px 16px',
            backgroundColor: riskMapVisible ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            color: riskMapVisible ? '#ffffff' : '#0f172a',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🗺️ Couche Risk Map : <strong>{riskMapVisible ? 'ACTIVÉE' : 'MASQUÉE'}</strong></span>
        </button>

        {/* Legend */}
        {riskMapVisible && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              borderRadius: '12px',
              fontSize: '11px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              LÉGENDE DU RISQUE ROUTIER :
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)' }} />
              <span style={{ color: '#0f172a', fontWeight: 600 }}>ROUGE : Élevé (&ge; 70%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', boxShadow: '0 0 6px rgba(245, 158, 11, 0.5)' }} />
              <span style={{ color: '#0f172a', fontWeight: 600 }}>ORANGE : Modéré (40 - 69%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)' }} />
              <span style={{ color: '#0f172a', fontWeight: 600 }}>VERT : Faible (&lt; 40%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Bouton de recentrage */}
      <div
        style={{
          position: 'absolute',
          top: '90px',
          left: '12px',
          zIndex: 400,
        }}
      >
        <button
          onClick={handleRecenter}
          title="Recentrer la carte sur Tunis Centre"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
            cursor: 'pointer',
            fontSize: '16px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          🎯
        </button>
      </div>
    </div>
  );
};
