/**
 * api.ts — Cliente HTTP centralizado do Pipocalizando
 * 
 * Agente responsável: Desenvolvedor Frontend
 * 
 * Este módulo encapsula todas as chamadas fetch ao backend,
 * injetando automaticamente o token JWT e tratando erros globais (401).
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

/**
 * Retorna os headers padrão, incluindo o token JWT se existir.
 */
function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Intercepta a resposta e trata erros globais.
 * Se 401 (Unauthorized), limpa o token e redireciona para login.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
  }

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
    });
    return handleResponse<T>(response);
  },

  post: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  put: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  patch: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  delete: async <T = any>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
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
    });
    return handleResponse<T>(response);
  },
};

export default api;
