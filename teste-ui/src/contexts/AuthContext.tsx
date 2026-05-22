/**
 * AuthContext.tsx — Contexto de Autenticação do Pipocalizando
 *
 * Agente responsável: Desenvolvedor Frontend
 *
 * Gerencia o estado de autenticação (login/logout/registro),
 * mantém apenas os dados do usuário na sessionStorage; o JWT fica em cookie HttpOnly.
 * para toda a aplicação via React Context.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api, { clearSession, getStoredUser, storeSession } from '../services/api';
import { normalizeRole, type Role } from '../lib/roles';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ao montar, tenta recuperar sessão ativa e migra credenciais legadas do localStorage.
  useEffect(() => {
    const storedUser = getStoredUser();
    let mounted = true;

    if (storedUser) {
      api.get<User>('/auth/profile')
        .then((profile) => {
          if (!mounted) return;

          const normalizedUser = {
            ...profile,
            role: normalizeRole(profile.role),
          };
          storeSession(normalizedUser);
          setUser(normalizedUser);
          setToken('cookie');
        })
        .catch(() => {
          if (!mounted) return;
          clearSession();
          setUser(null);
          setToken(null);
        })
        .finally(() => {
          if (mounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post<{ user: User }>('/auth/login', {
      email,
      password,
    });

    const normalizedUser = {
      ...response.user,
      role: normalizeRole(response.user.role),
    };
    storeSession(normalizedUser);

    setToken('cookie');
    setUser(normalizedUser);
  }

  async function register(name: string, email: string, password: string) {
    const response = await api.post<{ user: User }>('/auth/register', {
      name,
      email,
      password,
    });

    const normalizedUser = {
      ...response.user,
      role: normalizeRole(response.user.role),
    };
    storeSession(normalizedUser);

    setToken('cookie');
    setUser(normalizedUser);
  }

  function logout() {
    api.post('/auth/logout').finally(() => {
      clearSession();
      localStorage.removeItem('pipocalizando_cart');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    });
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
