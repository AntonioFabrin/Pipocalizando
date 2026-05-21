/**
 * AuthContext.tsx — Contexto de Autenticação do Pipocalizando
 *
 * Agente responsável: Desenvolvedor Frontend
 *
 * Gerencia o estado de autenticação (login/logout/registro),
 * armazena o token JWT no localStorage e expõe dados do usuário
 * para toda a aplicação via React Context.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function normalizeRole(role?: string) {
  if (!role) return role;
  return role === 'admin' ? 'super_admin' : role;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ao montar, tenta recuperar sessão do localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser({
        ...parsedUser,
        role: normalizeRole(parsedUser.role),
      });
    }

    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });

    localStorage.setItem('token', response.token);
    const normalizedUser = {
      ...response.user,
      role: normalizeRole(response.user.role),
    };
    localStorage.setItem('user', JSON.stringify(normalizedUser));

    setToken(response.token);
    setUser(normalizedUser);
  }

  async function register(name: string, email: string, password: string) {
    const response = await api.post<{ token: string; user: User }>('/auth/register', {
      name,
      email,
      password,
    });

    localStorage.setItem('token', response.token);
    const normalizedUser = {
      ...response.user,
      role: normalizeRole(response.user.role),
    };
    localStorage.setItem('user', JSON.stringify(normalizedUser));

    setToken(response.token);
    setUser(normalizedUser);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pipocalizando_cart');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
