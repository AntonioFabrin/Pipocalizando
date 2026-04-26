import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'seller' | 'customer';
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
        setUser(JSON.parse(storedUser));
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
    await AsyncStorage.setItem('@pipocalizando:token', newToken);
    await AsyncStorage.setItem('@pipocalizando:user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
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

  const isAdmin = user?.role === 'super_admin' || user?.role === 'manager';
  const isSeller = user?.role === 'seller' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isSeller }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
