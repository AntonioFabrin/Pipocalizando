/**
 * useSessions.ts — Hook para buscar sessões da API
 *
 * Agente responsável: Desenvolvedor Frontend
 *
 * Busca as sessões de filmes do backend e retorna os dados, loading e erro.
 */

import { useState, useEffect } from 'react';
import api from '../services/api';

export interface Session {
  id: number;
  movie: string;
  movie_id?: number;
  time: string;
  room: string;
  lang: string;
  type: string;
  date?: string;
  price?: number;
  available_seats?: number;
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<Session[]>('/movie-sessions');
        setSessions(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar sessões.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSessions();
  }, []);

  return { sessions, isLoading, error, setSessions };
}
