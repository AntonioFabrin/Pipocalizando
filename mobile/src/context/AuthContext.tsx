import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister } from '../services/api';
import { hasRole, normalizeRole, ADMIN_ROLES, STAFF_ROLES, SUPER_ADMIN_ROLES, type Role } from '../utils/roles';

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSeller: boolean;
  isSuperAdmin: boolean;
  canManageCatalog: boolean;
  canAccessManagementPanel: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@pipocalizando:token');
      const storedUser = await AsyncStorage.getItem('@pipocalizando:user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          role: normalizeRole(parsedUser.role),
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    const { token: newToken, user: newUser } = response.data;
    const normalizedUser = {
      ...newUser,
      role: normalizeRole(newUser.role),
    };
    await AsyncStorage.setItem('@pipocalizando:token', newToken);
    await AsyncStorage.setItem('@pipocalizando:user', JSON.stringify(normalizedUser));
    setToken(newToken);
    setUser(normalizedUser);
  };

  const register = async (data: RegisterData) => {
    await apiRegister({ ...data, role: 'customer' });
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@pipocalizando:token');
    await AsyncStorage.removeItem('@pipocalizando:user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = hasRole(user?.role, ADMIN_ROLES);
  const isSuperAdmin = hasRole(user?.role, SUPER_ADMIN_ROLES);
  const canManageCatalog = hasRole(user?.role, STAFF_ROLES);
  const isSeller = user?.role === 'seller';
  const canAccessManagementPanel = isAdmin;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isSeller, isSuperAdmin, canManageCatalog, canAccessManagementPanel }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
