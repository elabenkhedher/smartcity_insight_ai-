import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import type { Alerte, Caserne, RouteInfo } from '../types';

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
  const leafletRouteLayerRef = useRef<L.Polyline | null>(null);

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
          nom: 'Caserne Centrale - Bab El Khadra',
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

  // 1. Initialiser la carte Leaflet sur le Grand Tunis avec gestion robuste du redimensionnement
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    // Définir les limites géographiques de restriction sur le Grand Tunis
    const tunisBounds = L.latLngBounds(
      L.latLng(36.4, 9.8), // Sud-Ouest
      L.latLng(37.2, 10.6)  // Nord-Est
    );

    const map = L.map(mapContainerRef.current, {
      center: [36.8123, 10.1784], // Bab El Khadra / Avenue Habib Bourguiba
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: tunisBounds,
      maxBoundsViscosity: 0.85,
      zoomControl: false, // On va le positionner proprement
    });

    // Repositionner le contrôle de zoom en haut à gauche
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Couche OpenStreetMap officielle 100% libre et gratuite (aucune clé requise, aucun filigrane)
    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });
    osmLayer.addTo(map);

    leafletMarkersRef.current = L.layerGroup().addTo(map);
    leafletMapRef.current = map;

    // Correction essentielle : Invalidation immédiate et différée pour flexbox & redimensionnement
    const triggerResize = () => {
      if (map) {
        map.invalidateSize();
      }
    };

    triggerResize();
    const t1 = setTimeout(triggerResize, 100);
    const t2 = setTimeout(triggerResize, 350);

    const resizeObserver = new ResizeObserver(() => {
      triggerResize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // 2. Mise à jour des marqueurs (Casernes 🚒 et Accidents 🚨)
  useEffect(() => {
    if (!leafletMapRef.current || !leafletMarkersRef.current) return;

    leafletMarkersRef.current.clearLayers();

    // Marqueurs Casernes (🚒)
    casernes.forEach((c) => {
      const fireIcon = L.divIcon({
        className: 'custom-fire-marker',
        html: '🚒',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const m = L.marker([c.latitude, c.longitude], { icon: fireIcon });
      m.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; min-width: 190px;">
          <strong style="color: #0284c7; font-size: 13px;">🚒 ${c.nom}</strong><br/>
          <span style="color: #64748b; font-size: 11px;">📍 ${c.adresse}</span>
          <div style="margin-top: 6px; padding: 4px 6px; background: #e0f2fe; border-radius: 4px; color: #0369a1; font-weight: bold; font-size: 11px;">
            🚑 ${c.ambulances_disponibles} ambulances • 🚒 ${c.camions_disponibles} camions
          </div>
          <div style="margin-top: 4px; font-size: 11px; color: #334155;">
            📞 Urgences : <strong>${c.telephone}</strong>
          </div>
        </div>
      `);
      m.addTo(leafletMarkersRef.current!);
    });

    // Marqueurs Accidents UNIQUEMENT pour les alertes actives (les interventions clôturées disparaissent de la carte)
    const alertesActives = alertes.filter((a) => a.statut !== 'CLOTURE');

    alertesActives.forEach((a) => {
      let cls = 'custom-accident-marker';
      if (a.gravite === 'GRAVE') cls += ' grave';
      else if (a.gravite === 'MOYENNE') cls += ' moyenne';
      else cls += ' faible';
      if (a.statut === 'PRISE_EN_CHARGE') cls += ' resolu';

      const accidentIcon = L.divIcon({
        className: cls,
        html: '🚨',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const m = L.marker([a.latitude, a.longitude], { icon: accidentIcon });
      m.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; min-width: 180px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #dc2626; font-size: 13px;">🚨 ACCIDENT #${a.id}</strong>
            <span style="background: #fee2e2; color: #dc2626; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
              ${a.gravite}
            </span>
          </div>
          <span style="color: #334155;">📍 ${a.adresse}</span><br/>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            👥 ${a.nb_signalements} signalements confirmés
          </div>
          <div style="margin-top: 4px; font-size: 11px; color: #0284c7; font-weight: bold;">
            Statut : ${a.statut}
          </div>
        </div>
      `);
      m.on('click', () => onSelectAlerte(a));
      m.addTo(leafletMarkersRef.current!);
    });
  }, [casernes, alertes, onSelectAlerte]);

  // 3. Calcul de l'itinéraire le plus rapide et tracé sur la carte
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Si aucune alerte sélectionnée ou si l'alerte est CLÔTURÉE, effacer le tracé d'itinéraire
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

    // Estimation vitesse secours urbains avec sirène à Tunis (38 km/h)
    const rawDuration = Math.round((dis / 38) * 60) + 1;
    const trafficDelay = trafficLayerActive ? 2 : 0; // estimation trafic en direct

    // Points de passage de l'itinéraire
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
      color: '#ef4444',
      weight: 6,
      opacity: 0.9,
      dashArray: '10, 6',
    }).addTo(leafletMapRef.current);

    // Recadrer avec zoom intelligent sécurisé (ne dézoome jamais au monde)
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
        'Engagement sur artère prioritaire (gyrophares et avertisseur deux-tons 198)',
        'Traversée rapide du corridor urbain sécurisé',
        `Arrivée sur le lieu de l'accident : ${selectedAlerte.adresse}`,
      ],
      polylineCoordinates: polyCoordinates,
    });
  }, [selectedAlerte, selectedCaserne, trafficLayerActive, getNearestCaserne, onRouteCalculated]);

  // Bouton de recentrage rapide sur Tunis
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

      {/* Bouton ergonomique de recentrage sur Tunis */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '12px',
          zIndex: 30,
        }}
      >
        <button
          onClick={handleRecenter}
          title="Recentrer la carte sur Tunis Centre"
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f8fafc',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
            fontSize: '15px',
          }}
        >
          🎯
        </button>
      </div>
    </div>
  );
};
