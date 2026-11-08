import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { AlertsList } from '../components/AlertsList';
import { GoogleMapComponent } from '../components/GoogleMapComponent';
import { RoutePanel } from '../components/RoutePanel';
import { RiskMapModal } from '../components/RiskMapModal';
import {
  fetchAlertes,
  fetchCasernes,
  updateStatutAlerte,
  simulerAccident,
  WS_BASE_URL,
} from '../services/api';
import { playEmergencyAlarm, toggleSound, isSoundEnabled } from '../services/sound';
import type { Alerte, Caserne, RouteInfo, StatutAlerte } from '../types';

export const ProtectionCivilePage: React.FC = () => {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [casernes, setCasernes] = useState<Caserne[]>([]);
  const [selectedAlerte, setSelectedAlerte] = useState<Alerte | null>(null);
  const [selectedCaserne, setSelectedCaserne] = useState<Caserne | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);

  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [soundActive, setSoundActive] = useState<boolean>(isSoundEnabled());
  const [trafficActive, setTrafficActive] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [isRiskMapModalOpen, setIsRiskMapModalOpen] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Charger les alertes et les casernes initiales
  const loadInitialData = useCallback(async () => {
    try {
      const [alertesData, casernesData] = await Promise.all([
        fetchAlertes(),
        fetchCasernes(),
      ]);
      setAlertes(alertesData);
      setCasernes(casernesData);

      // Si des alertes actives existent, présélectionner la plus récente
      const activeAlert = alertesData.find(
        (a) => a.statut === 'CONFIRME' || a.statut === 'PRISE_EN_CHARGE'
      );
      if (activeAlert) {
        setSelectedAlerte(activeAlert);
      }
    } catch (err) {
      console.error('Erreur chargement initial:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Connexion WebSocket en direct (< 5s)
  useEffect(() => {
    let isMounted = true;

    function connectWebSocket() {
      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log('Connexion au WebSocket:', WS_BASE_URL);
      const ws = new WebSocket(WS_BASE_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        console.log('WebSocket Protection Civile connecté avec succès ✅');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          console.log('Message WebSocket reçu :', data);

          if (data.event === 'NOUVELLE_ALERTE_ACCIDENT' && data.alerte) {
            const rawAlerte = data.alerte;
            const formattedAlerte: Alerte = {
              id: rawAlerte.id,
              statut: rawAlerte.statut,
              gravite: rawAlerte.gravite,
              adresse: rawAlerte.adresse,
              latitude: Number(rawAlerte.latitude),
              longitude: Number(rawAlerte.longitude),
              nb_signalements: rawAlerte.nb_signalements || 1,
              date_confirmation: rawAlerte.date_confirmation,
              date_creation: rawAlerte.date_creation || new Date().toISOString(),
            };

            // Émettre l'alarme sonore de la Protection Civile
            playEmergencyAlarm();

            // Mettre à jour la file des alertes
            setAlertes((prev) => {
              const exists = prev.findIndex((a) => a.id === formattedAlerte.id);
              if (exists >= 0) {
                const updated = [...prev];
                updated[exists] = { ...updated[exists], ...formattedAlerte };
                return updated;
              }
              return [formattedAlerte, ...prev];
            });

            // Focus automatique et calcul immédiat de l'itinéraire vers la nouvelle alerte !
            setSelectedAlerte(formattedAlerte);
          }
        } catch (err) {
          console.error('Erreur parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        console.warn('WebSocket déconnecté, tentative de reconnexion dans 3s...');
        setWsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('Erreur WebSocket :', err);
        ws.close();
      };
    }

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Actions
  const handleUpdateStatut = async (id: number, nouveauStatut: StatutAlerte) => {
    try {
      const res = await updateStatutAlerte(id, nouveauStatut);
      setAlertes((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, statut: res.nouveau_statut as StatutAlerte } : a
        )
      );
      if (selectedAlerte?.id === id) {
        if (nouveauStatut === 'CLOTURE') {
          // Si l'intervention est clôturée : la retirer immédiatement de la sélection et effacer l'itinéraire
          setSelectedAlerte(null);
          setActiveRoute(null);
        } else {
          setSelectedAlerte((prev) =>
            prev ? { ...prev, statut: res.nouveau_statut as StatutAlerte } : null
          );
        }
      }
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    }
  };

  const handleSimulateAccident = async () => {
    setSimulating(true);
    try {
      const res = await simulerAccident();
      if (res && res.alerte_id) {
        const simulatedAlerte: Alerte = {
          id: res.alerte_id,
          statut: res.statut || 'CONFIRME',
          gravite: res.gravite || 'GRAVE',
          adresse: res.adresse || 'Tunis Centre',
          latitude: Number(res.latitude),
          longitude: Number(res.longitude),
          nb_signalements: 1,
          date_confirmation: res.date_confirmation || new Date().toISOString(),
          date_creation: new Date().toISOString(),
        };

        // Ajout immédiat à la liste et traçage direct de l'intervention
        setAlertes((prev) => {
          const exists = prev.findIndex((a) => a.id === simulatedAlerte.id);
          if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = { ...updated[exists], ...simulatedAlerte };
            return updated;
          }
          return [simulatedAlerte, ...prev];
        });
        setSelectedAlerte(simulatedAlerte);
        playEmergencyAlarm();
      }
    } catch (err) {
      console.error('Erreur simulation accident:', err);
    } finally {
      setTimeout(() => setSimulating(false), 800);
    }
  };

  const handleSelectAlerte = (alerte: Alerte) => {
    setSelectedAlerte(alerte);
  };

  const handleTracerItineraire = (alerte: Alerte) => {
    setSelectedAlerte(alerte);
  };

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundActive(next);
  };

  const activeAlertsCount = alertes.filter(
    (a) => a.statut === 'CONFIRME' || a.statut === 'PRISE_EN_CHARGE' || a.statut === 'EN_INTERVENTION'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Header bar opérationnel */}
      <Header
        wsConnected={wsConnected}
        soundEnabled={soundActive}
        onToggleSound={handleToggleSound}
        trafficLayerActive={trafficActive}
        onToggleTraffic={() => setTrafficActive(!trafficActive)}
        onOpenRiskMapModal={() => setIsRiskMapModalOpen(true)}
        onSimulateAccident={handleSimulateAccident}
        simulating={simulating}
        activeCount={activeAlertsCount}
      />

      {/* Disposition ergonomique en 3 colonnes : File d'Alertes | Carte Plein Écran | Panneau d'Itinéraire */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Colonne 1 : File des Alertes & Incidents */}
        <AlertsList
          alertes={alertes}
          selectedAlerte={selectedAlerte}
          onSelectAlerte={handleSelectAlerte}
          onUpdateStatut={handleUpdateStatut}
          onTracerItineraire={handleTracerItineraire}
        />

        {/* Colonne 2 : Carte Tactique Plein Écran */}
        <div style={{ flex: 1, position: 'relative', height: '100%', minWidth: 0, overflow: 'hidden' }}>
          <GoogleMapComponent
            casernes={casernes}
            alertes={alertes}
            selectedAlerte={selectedAlerte}
            selectedCaserne={selectedCaserne}
            trafficLayerActive={trafficActive}
            onSelectAlerte={handleSelectAlerte}
            onRouteCalculated={setActiveRoute}
          />
        </div>

        {/* Colonne 3 : Panneau d'Intervention d'Urgence */}
        {activeRoute && selectedAlerte && (
          <RoutePanel
            routeInfo={activeRoute}
            casernes={casernes}
            onSelectCaserne={(c) => setSelectedCaserne(c)}
            onClose={() => {
              setActiveRoute(null);
              setSelectedAlerte(null);
            }}
            onValiderIntervention={() => {
              handleUpdateStatut(selectedAlerte.id, 'EN_INTERVENTION');
              playEmergencyAlarm();
            }}
          />
        )}
      </div>

      {/* Modal Risk Map Machine Learning */}
      <RiskMapModal
        isOpen={isRiskMapModalOpen}
        onClose={() => setIsRiskMapModalOpen(false)}
      />
    </div>
  );
};
