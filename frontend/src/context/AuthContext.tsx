import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, UserProfile } from '../types';

export const DEMO_ACCOUNTS: Record<Role, UserProfile> = {
  PROTECTION_CIVILE: {
    id: 'usr-pc-01',
    name: 'Cdt. Youssef Ben Amor',
    email: 'y.benamor@protectioncivile.tn',
    role: 'PROTECTION_CIVILE',
    title: 'Officier Supérieur de Garde — CCO 198',
    badgeNumber: 'PC-TUNIS-7402',
    department: 'Protection Civile du Grand Tunis',
    assignedZone: 'Bab El Khadra / District Central',
    avatarInitials: 'YB',
  },
  DECIDEUR_MUNICIPAL: {
    id: 'usr-dec-02',
    name: 'Dr. Leila Ferchichi',
    email: 'leila.ferchichi@gouvernorat-tunis.gov.tn',
    role: 'DECIDEUR_MUNICIPAL',
    title: 'Directrice de Crise & Décideur Métropolitain',
    badgeNumber: 'DEC-TUN-001',
    department: 'Gouvernorat de Tunis — Cellule de Crise & Mobilité',
    assignedZone: 'Grand Tunis (Tous Secteurs & Risk Map)',
    avatarInitials: 'LF',
  },
  ADMIN_SYSTEME: {
    id: 'usr-adm-03',
    name: 'Mehdi Trabelsi',
    email: 'mehdi.trabelsi@smartcity.gov.tn',
    role: 'ADMIN_SYSTEME',
    title: 'Superviseur Architecture Distribuée & Sécurité PostGIS/Redis',
    badgeNumber: 'SYS-OPS-09',
    department: 'Direction des Systèmes d’Information & Télécommunications',
    assignedZone: 'Grand Tunis Telemetry Core',
    avatarInitials: 'MT',
  },
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, role?: Role) => boolean;
  logout: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'smartcity_tunis_auth_user_etud3';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erreur lecture auth local storage', e);
    }
    return DEMO_ACCOUNTS.PROTECTION_CIVILE;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (email: string, selectedRole?: Role): boolean => {
    if (selectedRole && DEMO_ACCOUNTS[selectedRole]) {
      setUser(DEMO_ACCOUNTS[selectedRole]);
      return true;
    }

    const match = Object.values(DEMO_ACCOUNTS).find(
      (acc) => acc.email.toLowerCase() === email.toLowerCase()
    );

    if (match) {
      setUser(match);
      return true;
    }

    // Default fallback to Protection Civile
    setUser(DEMO_ACCOUNTS.PROTECTION_CIVILE);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: Role) => {
    if (DEMO_ACCOUNTS[newRole]) {
      setUser(DEMO_ACCOUNTS[newRole]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider');
  }
  return context;
};
