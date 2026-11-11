import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProtectionCivilePage } from './pages/ProtectionCivilePage';
import { DecideursPage } from './pages/DecideursPage';
import { AuditPage } from './pages/AuditPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Flagship Home Page - Mission Étudiant 3 */}
          <Route path="/" element={<HomePage />} />

          {/* Authentication & Role Switcher */}
          <Route path="/connexion" element={<LoginPage />} />

          {/* Priorité 1 : Protection Civile (CCO 198) - Alertes < 5s & Routes API */}
          <Route path="/protection-civile" element={<ProtectionCivilePage />} />

          {/* Priorité 3 : Cockpit Décideurs - Risk Map & Assistant LLM */}
          <Route path="/decideurs" element={<DecideursPage />} />
          <Route path="/responsable" element={<Navigate to="/decideurs" replace />} />

          {/* Priorité 2 : Supervision, Workflow Horodaté & Qualification PostGIS */}
          <Route path="/audit" element={<AuditPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
