import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  devTokenModal: { open: boolean; email: string; token: string } | null;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  closeDevTokenModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; department?: string }) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [devTokenModal, setDevTokenModal] = useState<{ open: boolean; email: string; token: string } | null>(null);

  const fetchMe = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (error) {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const closeDevTokenModal = () => setDevTokenModal(null);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const register = async (data: { email: string; password: string; name: string; department?: string }) => {
    const res = await api.register(data);
    if (res.devVerificationToken) {
      setDevTokenModal({
        open: true,
        email: data.email,
        token: res.devVerificationToken,
      });
    }
    setIsAuthModalOpen(false);
  };

  const verify = async (email: string, code: string) => {
    const res = await api.verify({ email, verificationToken: code });
    setAuthToken(res.token);
    setUser(res.user);
    setDevTokenModal(null);
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        devTokenModal,
        openAuthModal,
        closeAuthModal,
        closeDevTokenModal,
        login,
        register,
        verify,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
