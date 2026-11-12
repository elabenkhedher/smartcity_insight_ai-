import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FileEdit, LayoutDashboard, Siren, ShieldCheck } from 'lucide-react';
import { CitizenReportForm } from './components/CitizenReportForm';
import { MunicipalDashboard } from './components/MunicipalDashboard';
import { ProtectionCivilePage } from './pages/ProtectionCivilePage';

const NavigationBar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Signalement Citoyen', icon: FileEdit },
    { path: '/dashboard', label: 'Dashboard Municipal', icon: LayoutDashboard },
    { path: '/protection-civile', label: 'Protection Civile', icon: Siren },
  ];

  return (
    <header
      style={{
        background: 'var(--bg-dark)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
            borderRadius: 8,
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 15,
            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.4)',
          }}
        >
          SC
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
            SmartCity <span style={{ color: '#38bdf8' }}>Insight AI</span>
          </span>
          <span
            style={{
              marginLeft: 10,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '2px 8px',
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ShieldCheck size={12} /> INPDP Protected
          </span>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: 6 }}>
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/' || location.pathname === '/citoyen'
              : item.path === '/dashboard'
                ? location.pathname.startsWith('/dashboard') ||
                  location.pathname.startsWith('/responsable')
                : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-muted)',
                background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.4)' : 'transparent'}`,
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} color={isActive ? '#38bdf8' : 'currentColor'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
        }}
      >
        <NavigationBar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--bg-darker)',
          }}
        >
          <Routes>
            <Route path="/" element={<CitizenReportForm />} />
            <Route path="/citoyen" element={<CitizenReportForm />} />
            <Route path="/dashboard" element={<MunicipalDashboard />} />
            <Route path="/responsable" element={<MunicipalDashboard />} />
            <Route path="/protection-civile" element={<ProtectionCivilePage />} />
            <Route path="*" element={<CitizenReportForm />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
