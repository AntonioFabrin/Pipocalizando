/**
 * api.ts — Cliente HTTP centralizado do Pipocalizando
 * 
 * Agente responsável: Desenvolvedor Frontend
 * 
 * Este módulo encapsula todas as chamadas fetch ao backend,
 * enviando automaticamente o cookie HttpOnly de sessao e tratando erros globais (401).
 */

const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const getApiUrl = () => {
  if (typeof window === 'undefined') return configuredApiUrl;

  try {
    const apiUrl = new URL(configuredApiUrl);
    const isLoopbackApi = apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1';
    const isBrowserOnLoopbackOrLan = window.location.hostname !== apiUrl.hostname;

    // Keep the auth cookie on the same local host the browser is using.
    if (isLoopbackApi && isBrowserOnLoopbackOrLan) {
      apiUrl.hostname = window.location.hostname;
      return apiUrl.toString().replace(/\/$/, '');
    }
  } catch {
    return configuredApiUrl;
  }

  return configuredApiUrl;
};

const API_URL = getApiUrl();

export function getStoredUser() {
  const sessionUser = sessionStorage.getItem(USER_KEY);
  if (sessionUser) return sessionUser;

  const legacyUser = localStorage.getItem(USER_KEY);
  if (legacyUser) {
    sessionStorage.setItem(USER_KEY, legacyUser);
    localStorage.removeItem(USER_KEY);
  }

  return legacyUser;
}

export function storeSession(user: unknown) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const getLegacyToken = () =>
  sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);

const clearLegacyToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Retorna os headers padrão da requisição.
 */
function getHeaders(isFormData = false): HeadersInit {
  const headers: Record<string, string> = {};
  const legacyToken = getLegacyToken();

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (legacyToken) {
    headers.Authorization = `Bearer ${legacyToken}`;
  }

  return headers;
}

/**
 * Intercepta a resposta e trata erros globais.
 * Se 401 (Unauthorized), limpa a sessao local e redireciona para login.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearSession();
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
  }

  clearLegacyToken();

  // Se 204 No Content, retorna vazio
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Funções genéricas de requisição HTTP
 */
export const api = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse<T>(response);
  },

  post: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });
    return handleResponse<T>(response);
  },

  put: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });
    return handleResponse<T>(response);
  },

  patch: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });
    return handleResponse<T>(response);
  },

  delete: async <T = any>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse<T>(response);
  },

  /**
   * Upload de arquivos usando FormData (para o multer do backend).
   * Use para upload de capas de filmes e imagens.
   */
  upload: async <T = any>(endpoint: string, formData: FormData): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(true), // Sem Content-Type, o browser define com boundary
      body: formData,
      credentials: 'include',
    });
    return handleResponse<T>(response);
  },
};

export default api;
