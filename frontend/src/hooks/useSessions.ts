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

interface ApiSession {
  id: number;
  movie?: string;
  movie_id?: number;
  movie_title?: string;
  time?: string;
  session_time?: string;
  room?: string;
  room_name?: string;
  room_type?: string;
  lang?: string;
  language?: string;
  type?: string;
  date?: string;
  session_date?: string;
  price?: number | string;
  available_seats?: number;
}

const normalizeDate = (value?: string) => {
  if (!value) return '';

  const isoDate = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTime = (value?: string) => {
  if (!value) return 'Horario a definir';
  return value.slice(0, 5);
};

const normalizeSession = (session: ApiSession): Session => ({
  id: session.id,
  movie: session.movie || session.movie_title || 'Filme sem titulo',
  movie_id: session.movie_id,
  time: normalizeTime(session.time || session.session_time),
  room: session.room_name || session.room || 'Sala a definir',
  lang: session.lang || session.language || 'dublado',
  type: session.type || session.room_type || 'standard',
  date: normalizeDate(session.date || session.session_date),
  price: session.price === undefined ? undefined : Number(session.price),
  available_seats: session.available_seats,
});

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<ApiSession[]>('/movie-sessions');
        setSessions(data.map(normalizeSession));
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
