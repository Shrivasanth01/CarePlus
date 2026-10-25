import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  token: string | null;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  loginWithRole: (role: 'Administrator' | 'Staff' | 'Patient') => void;
}

export const PORTAL_USERS: Record<string, User> = {
  Administrator: {
    id: 1,
    name: 'Dr. Alexander Vance',
    email: 'admin@careplus.com',
    role: 'Administrator',
    is_active: true,
    created_at: new Date().toISOString(),
    department: 'Hospital IT & Clinical Systems'
  },
  Staff: {
    id: 2,
    name: 'Nurse Sarah Jenkins, RN',
    email: 'staff@careplus.com',
    role: 'Staff',
    is_active: true,
    created_at: new Date().toISOString(),
    department: 'Emergency & Critical Care ICU'
  },
  Patient: {
    id: 3,
    name: 'Eleanor Rigby',
    email: 'patient@careplus.com',
    role: 'Patient',
    is_active: true,
    created_at: new Date().toISOString(),
    patient_id: 'PT-88219'
  },
  // Compatibility aliases
  Admin: {
    id: 1,
    name: 'Dr. Alexander Vance',
    email: 'admin@careplus.com',
    role: 'Administrator',
    is_active: true,
    created_at: new Date().toISOString(),
    department: 'Hospital IT & Clinical Systems'
  },
  Operator: {
    id: 2,
    name: 'Nurse Sarah Jenkins, RN',
    email: 'staff@careplus.com',
    role: 'Staff',
    is_active: true,
    created_at: new Date().toISOString(),
    department: 'Emergency & Critical Care ICU'
  },
  Viewer: {
    id: 3,
    name: 'Eleanor Rigby',
    email: 'patient@careplus.com',
    role: 'Patient',
    is_active: true,
    created_at: new Date().toISOString(),
    patient_id: 'PT-88219'
  }
};

const AuthContext = createContext<AuthContextType>({
  currentUser: PORTAL_USERS.Administrator,
  switchRole: () => {},
  token: 'mock-jwt-token-admin',
  logout: () => {},
  isLoginModalOpen: false,
  setIsLoginModalOpen: () => {},
  loginWithRole: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('careplus_role');
    return (saved && PORTAL_USERS[saved]) ? PORTAL_USERS[saved] : PORTAL_USERS.Administrator;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const switchRole = (role: UserRole) => {
    const user = PORTAL_USERS[role] || PORTAL_USERS.Administrator;
    setCurrentUser(user);
    localStorage.setItem('careplus_role', user.role);
  };

  const loginWithRole = (role: 'Administrator' | 'Staff' | 'Patient') => {
    switchRole(role);
    setIsLoginModalOpen(false);
  };

  const logout = () => {
    switchRole('Patient');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
        token: `mock-jwt-token-${currentUser.role.toLowerCase()}`,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginWithRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
