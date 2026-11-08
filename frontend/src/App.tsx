import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectionCivilePage } from './pages/ProtectionCivilePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/protection-civile" element={<ProtectionCivilePage />} />
        <Route path="/" element={<Navigate to="/protection-civile" replace />} />
        <Route path="*" element={<Navigate to="/protection-civile" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
