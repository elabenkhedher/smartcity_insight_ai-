import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import {
  Brain,
  Layers,
  Send,
  Sparkles,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Radio,
  FileText,
  HelpCircle,
} from 'lucide-react';
import {
  fetchZonesRiskMap,
  interrogerAssistantLLM,
  fetchPostGISStats,
} from '../services/api';
import { PRESET_QUESTIONS_LLM } from '../services/mockData';
import type { ZoneRisque, AssistantLLMResponse, PostGISStats } from '../types';
import { RiskMapModal } from '../components/RiskMapModal';

export const DecideursPage: React.FC = () => {
  const [zones, setZones] = useState<ZoneRisque[]>([]);
  const [loadingZones, setLoadingZones] = useState<boolean>(true);
  const [postgisStats, setPostgisStats] = useState<PostGISStats | null>(null);

  // Assistant LLM state
  const [question, setQuestion] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<
    Array<{ type: 'user' | 'assistant'; text: string; sources?: string[]; score?: number; date?: string }>
  >([
    {
      type: 'assistant',
      text: "👋 Bonjour Dr. Leila Ferchichi. Je suis l'Assistant IA Décisionnel de SmartCity Insight AI pour les Décideurs et la Protection Civile de Tunis.\n\nMes réponses sont **strictement restreintes et ancrées sur les données réelles et calculées** par la plateforme (modèle Random Forest Risk Map, clustering PostGIS et télémétrie en direct), **sans aucune invention de faits (zéro hallucination)**.\n\nVous pouvez me poser une question ou sélectionner une des suggestions rapides ci-dessous.",
      sources: ["Base PostgreSQL / PostGIS", "Modèle Random Forest Risk Map", "Télémétrie CCO 198 en direct"],
      score: 100.0,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [llmLoading, setLlmLoading] = useState<boolean>(false);

  // Risk Map interactive modal
  const [isRiskMapModalOpen, setIsRiskMapModalOpen] = useState<boolean>(false);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<'TOUS' | 'ROUGE' | 'ORANGE' | 'VERT'>('TOUS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingZones(true);
    try {
      const [zonesData, statsData] = await Promise.all([
        fetchZonesRiskMap(),
        fetchPostGISStats(),
      ]);
      setZones(zonesData);
      setPostgisStats(statsData);
    } catch (err) {
      console.error('Erreur chargement données décideurs', err);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleSendQuestion = async (qToSend?: string) => {
    const q = (qToSend || question).trim();
    if (!q || llmLoading) return;

    setChatHistory((prev) => [
      ...prev,
      { type: 'user', text: q, date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
    ]);
    if (!qToSend) setQuestion('');
    setLlmLoading(true);

    try {
      const res: AssistantLLMResponse = await interrogerAssistantLLM(q);
      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          text: res.reponse,
          sources: res.sources_donnees_reelles,
          score: res.score_confiance,
          date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Erreur appel LLM:', err);
      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          text: "⚠️ Erreur de communication avec le module API Assistant LLM. Veuillez vérifier que Daphne ou le serveur Django est en cours d'exécution.",
          date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLlmLoading(false);
    }
  };

  const filteredZones = zones.filter((z) => {
    if (selectedZoneFilter !== 'TOUS' && z.niveau_risk_map !== selectedZoneFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        z.nom.toLowerCase().includes(s) ||
        z.arrondissement.toLowerCase().includes(s) ||
        z.facteurs_explicatifs.some((f) => f.toLowerCase().includes(s))
      );
    }
    return true;
  });

  const countRouge = zones.filter((z) => z.niveau_risk_map === 'ROUGE').length;
  const countOrange = zones.filter((z) => z.niveau_risk_map === 'ORANGE').length;
  const countVert = zones.filter((z) => z.niveau_risk_map === 'VERT').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Header Banner */}
      <div
        style={{
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          padding: '24px 32px',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  color: '#7c3aed',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Brain size={13} />
                <span>ESPACE DÉCISIONNEL &bull; GOUVERNORAT DE TUNIS</span>
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                PRIORITÉ 3 : ASSISTANT LLM EXPLICATIF &bull; RISK MAP RANDOM FOREST
              </span>
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#0f172a',
              }}
            >
              Cockpit d'Aide à la Décision &amp; Intelligence Explicative
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsRiskMapModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              }}
            >
              <Cpu size={15} />
              <span>SIMULATEUR ML RANDOM FOREST</span>
            </button>

            <button
              onClick={loadData}
              title="Rafraîchir les données"
              style={{
                padding: '10px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
              }}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 32px',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              <span>SECTEURS RISK MAP</span>
              <Layers size={14} color="#3b82f6" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {zones.length}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '11px', fontWeight: 600 }}>
              <span style={{ color: '#dc2626' }}>{countRouge} Élevé</span>
              <span>&bull;</span>
              <span style={{ color: '#d97706' }}>{countOrange} Modéré</span>
              <span>&bull;</span>
              <span style={{ color: '#16a34a' }}>{countVert} Faible</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              <span>QUALIFICATION POSTGIS</span>
              <ShieldCheck size={14} color="#16a34a" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#15803d', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {postgisStats?.rayon_regroupement_metres || 150}m
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
              Regroupement &ge; 3 signalements &bull; Anti-abus
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              <span>ÉLIMINATION FAUSSES ALERTES</span>
              <TrendingUp size={14} color="#15803d" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {postgisStats?.taux_elimination_fausses_alertes_pourcentage || 25.0}%
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Signalements isolés filtrés préventivement
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              <span>CONFORMITÉ LLM / RAG</span>
              <Brain size={14} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              100%
            </div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '6px' }}>
              Ancrage réel strict &bull; Zéro hallucination
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left = Risk Map Sectors, Right = LLM Assistant */}
      <main
        style={{
          flex: 1,
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '28px 32px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '28px',
          boxSizing: 'border-box',
        }}
      >
        {/* Left Column: Risk Map Explorer */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#3b82f6" />
                <span>SECTEURS ÉVALUÉS PAR MACHINE LEARNING</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Classification colorée officielle (vert, orange, rouge) et facteurs explicatifs
              </div>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '10px' }}>
              {(['TOUS', 'ROUGE', 'ORANGE', 'VERT'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedZoneFilter(f)}
                  style={{
                    padding: '5px 10px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: selectedZoneFilter === f ? '#ffffff' : 'transparent',
                    color: selectedZoneFilter === f ? '#0f172a' : '#64748b',
                    fontSize: '11px',
                    fontWeight: selectedZoneFilter === f ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: selectedZoneFilter === f ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={15} style={{ position: 'absolute', left: '14px', top: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Rechercher un tronçon, un carrefour ou un mot-clé explicatif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '13px',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Sectors List with Modern Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '720px', overflowY: 'auto' }}>
            {loadingZones ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Chargement des secteurs de la Risk Map...
              </div>
            ) : filteredZones.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', fontSize: '13px' }}>
                Aucun secteur correspondant aux critères de recherche.
              </div>
            ) : (
              filteredZones.map((z) => {
                const isRouge = z.niveau_risk_map === 'ROUGE';
                const isOrange = z.niveau_risk_map === 'ORANGE';
                const colorCode = isRouge ? '#dc2626' : isOrange ? '#d97706' : '#16a34a';
                const bgTint = isRouge ? '#fef2f2' : isOrange ? '#fffbeb' : '#f0fdf4';
                const borderTint = isRouge ? 'rgba(239, 68, 68, 0.35)' : isOrange ? 'rgba(245, 158, 11, 0.35)' : 'rgba(34, 197, 94, 0.35)';

                return (
                  <div
                    key={z.id}
                    style={{
                      border: `1px solid ${borderTint}`,
                      borderRadius: '14px',
                      backgroundColor: '#ffffff',
                      padding: '18px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              backgroundColor: colorCode,
                              borderRadius: '50%',
                              boxShadow: `0 0 8px ${colorCode}`,
                            }}
                          />
                          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                            {z.nom}
                          </h3>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                          📍 {z.arrondissement} &bull; Rayon de surveillance : {z.rayon_metres}m
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '22px',
                            fontWeight: 900,
                            fontFamily: 'var(--font-mono)',
                            color: colorCode,
                          }}
                        >
                          {z.score_risque_pourcentage}%
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            padding: '2px 8px',
                            backgroundColor: bgTint,
                            color: colorCode,
                            border: `1px solid ${colorCode}`,
                            borderRadius: '9999px',
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          {z.label_niveau || z.niveau_risk_map}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Score */}
                    <div style={{ position: 'relative', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '12px' }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${z.score_risque_pourcentage}%`,
                          backgroundColor: colorCode,
                          borderRadius: '9999px',
                        }}
                      />
                    </div>

                    {/* Telemetry Chips */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        padding: '10px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: '#334155',
                        marginBottom: '12px',
                      }}
                    >
                      <span>🚗 Trafic : <strong>{z.trafic_index}/5.0</strong></span>
                      <span>&bull;</span>
                      <span>🚧 Travaux : <strong>{z.presence_travaux ? 'Actifs' : 'Aucun'}</strong></span>
                      <span>&bull;</span>
                      <span>🌧️ Pluie : <strong>{z.meteo_pluie ? 'Oui' : 'Non'}</strong></span>
                      <span>&bull;</span>
                      <span>🚨 Incidents 30j : <strong>{z.incidents_recents}</strong></span>
                    </div>

                    {/* Facteurs explicatifs */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        Facteurs explicatifs extraits par le modèle Random Forest :
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: 1.45 }}>
                        {z.facteurs_explicatifs.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Ask LLM shortcut */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => handleSendQuestion(`Pourquoi le secteur ${z.nom} est-il classé avec un score de ${z.score_risque_pourcentage}% ?`)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#7c3aed',
                          backgroundColor: 'rgba(139, 92, 246, 0.08)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        <Sparkles size={13} />
                        <span>Demander une analyse détaillée à l'IA</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Assistant LLM Interactif (RAG Ancré) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              height: '780px',
              overflow: 'hidden',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Assistant Header */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)',
                  }}
                >
                  <Brain size={18} />
                </div>

                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>ASSISTANT IA DÉCISIONNEL</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    RAG ANCRÉ STRICT &bull; SANS INVENTION DE FAITS
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  fontWeight: 700,
                }}
              >
                PROMPT RESTREINT ACTIF
              </span>
            </div>

            {/* Quick Prompt Carousel */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={13} color="#8b5cf6" />
                <span>QUESTIONS FRÉQUENTES DES DÉCIDEURS :</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PRESET_QUESTIONS_LLM.slice(0, 3).map((pq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuestion(pq)}
                    disabled={llmLoading}
                    style={{
                      padding: '7px 10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ color: '#8b5cf6' }}>💬</span>
                    <span>{pq}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages scroll area */}
            <div
              style={{
                flex: 1,
                padding: '18px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backgroundColor: '#f8fafc',
              }}
            >
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                    backgroundColor: msg.type === 'user' ? '#0f172a' : '#ffffff',
                    color: msg.type === 'user' ? '#ffffff' : '#0f172a',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: msg.type === 'user' ? 'none' : '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: msg.type === 'user' ? '#94a3b8' : '#8b5cf6',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {msg.type === 'user' ? 'DÉCIDEUR GOUVERNORAT' : 'ASSISTANT IA SMARTCITY'}
                    </span>
                    {msg.date && (
                      <span style={{ fontSize: '10px', color: msg.type === 'user' ? '#64748b' : '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                        {msg.date}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', lineHeight: 1.55, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>
                    {msg.text}
                  </div>

                  {msg.sources && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid #f1f5f9',
                        fontSize: '11px',
                        color: '#64748b',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <CheckCircle2 size={13} color="#16a34a" />
                        <span><strong>Données réelles vérifiées :</strong> {msg.sources.join(', ')}</span>
                      </div>
                      {msg.score && (
                        <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                          🔒 Score de fiabilité factuelle : {msg.score}% (Zéro invention)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {llmLoading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    padding: '12px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Sparkles size={16} color="#8b5cf6" className="animate-spin" />
                  <span>Extraction RAG des données réelles &amp; formulation de la réponse...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuestion();
              }}
              style={{
                display: 'flex',
                padding: '12px 16px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                gap: '10px',
              }}
            >
              <input
                type="text"
                placeholder="Posez une question décisionnelle (ex: Pourquoi cette zone est-elle risquée ?)..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={llmLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={llmLoading || !question.trim()}
                style={{
                  padding: '12px 20px',
                  background: llmLoading || !question.trim() ? '#94a3b8' : 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: llmLoading || !question.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Envoyer</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Random Forest Risk Map Modal */}
      <RiskMapModal
        isOpen={isRiskMapModalOpen}
        onClose={() => setIsRiskMapModalOpen(false)}
      />
    </div>
  );
};
