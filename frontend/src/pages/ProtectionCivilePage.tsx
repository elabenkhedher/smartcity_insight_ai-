import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
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
      try {
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

              setAlertes((prev) => {
                const filtered = prev.filter((a) => a.id !== formattedAlerte.id);
                return [formattedAlerte, ...filtered];
              });

              setSelectedAlerte(formattedAlerte);
            }
          } catch (e) {
            console.error('Erreur parsing WebSocket message', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('Erreur WebSocket (Daphne non lancé ou hors ligne)', err);
          if (isMounted) setWsConnected(false);
        };

        ws.onclose = () => {
          if (isMounted) setWsConnected(false);
        };
      } catch (err) {
        console.warn('WebSocket init error', err);
      }
    }

    connectWebSocket();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Déclencher un accident test
  const handleSimulateAccident = async () => {
    setSimulating(true);
    try {
      const res = await simulerAccident();
      console.log('Accident simulé avec succès :', res);
      // Recharger pour assurer la synchro immédiate
      await loadInitialData();
    } catch (err) {
      console.warn('Backend injoignable, injection locale pour test tactile', err);
      // Création d'une alerte locale de démonstration
      const fakeAlerte: Alerte = {
        id: Math.floor(100 + Math.random() * 900),
        statut: 'CONFIRME',
        gravite: 'GRAVE',
        adresse: 'Avenue Habib Bourguiba, Tunis Centre',
        latitude: 36.8002,
        longitude: 10.1865,
        nb_signalements: 3,
        date_creation: new Date().toISOString(),
        date_confirmation: new Date().toISOString(),
      };
      playEmergencyAlarm();
      setAlertes((prev) => [fakeAlerte, ...prev]);
      setSelectedAlerte(fakeAlerte);
    } finally {
      setSimulating(false);
    }
  };

  // Mettre à jour le statut d'une intervention
  const handleUpdateStatut = async (alerteId: number, nouveauStatut: StatutAlerte) => {
    try {
      await updateStatutAlerte(alerteId, nouveauStatut);
    } catch (err) {
      console.warn('Backend statut update injoignable, mise à jour locale', err);
    }

    setAlertes((prev) =>
      prev.map((a) => (a.id === alerteId ? { ...a, statut: nouveauStatut } : a))
    );

    if (selectedAlerte && selectedAlerte.id === alerteId) {
      setSelectedAlerte((prev) => (prev ? { ...prev, statut: nouveauStatut } : null));
    }
  };

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundActive(newState);
  };

  const activeEmergenciesCount = alertes.filter((a) => a.statut !== 'CLOTURE').length;

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
      {/* Global Navigation Bar */}
      <Navbar />

      {/* Emergency Tactical Command Subheader */}
      <Header
        wsConnected={wsConnected}
        soundEnabled={soundActive}
        onToggleSound={handleToggleSound}
        trafficLayerActive={trafficActive}
        onToggleTraffic={() => setTrafficActive((prev) => !prev)}
        onOpenRiskMapModal={() => setIsRiskMapModalOpen(true)}
        onSimulateAccident={handleSimulateAccident}
        simulating={simulating}
        activeCount={activeEmergenciesCount}
      />

      {/* Main Tactical Operational View */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Left Side: Real-Time Alerts Drawer */}
        <AlertsList
          alertes={alertes}
          selectedAlerte={selectedAlerte}
          onSelectAlerte={(a) => {
            setSelectedAlerte(a);
            setActiveRoute(null);
          }}
          onUpdateStatut={handleUpdateStatut}
          onTracerItineraire={(a) => {
            setSelectedAlerte(a);
          }}
        />

        {/* Center: Tactical Grand Tunis Map */}
        <div style={{ flex: 1, position: 'relative', height: '100%', width: '100%' }}>
          <GoogleMapComponent
            casernes={casernes}
            alertes={alertes}
            selectedAlerte={selectedAlerte}
            selectedCaserne={selectedCaserne}
            trafficLayerActive={trafficActive}
            onSelectAlerte={(a) => {
              setSelectedAlerte(a);
            }}
            onRouteCalculated={(route) => {
              setActiveRoute(route);
            }}
          />
        </div>

        {/* Right Side: Route & Station Dispatch Panel */}
        {activeRoute && (
          <RoutePanel
            routeInfo={activeRoute}
            casernes={casernes}
            onSelectCaserne={(caserne) => setSelectedCaserne(caserne)}
            onClose={() => setActiveRoute(null)}
            onValiderIntervention={() => {
              if (selectedAlerte) {
                handleUpdateStatut(selectedAlerte.id, 'PRISE_EN_CHARGE');
              }
              setActiveRoute(null);
            }}
          />
        )}
      </div>

      {/* Random Forest Risk Map Modal */}
      <RiskMapModal
        isOpen={isRiskMapModalOpen}
        onClose={() => setIsRiskMapModalOpen(false)}
      />
    </div>
  );
};
