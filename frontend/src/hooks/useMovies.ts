/**
 * useMovies.ts — Hook para buscar filmes da API
 *
 * Agente responsável: Desenvolvedor Frontend
 *
 * Busca os filmes do backend e retorna os dados, loading e erro.
 */

import { useState, useEffect } from 'react';
import api from '../services/api';

export interface Movie {
  id: number;
  title: string;
  description: string;
  genre: string;
  rating: string;
  poster_url: string | null;
  session_date: string;
  session_time: string;
  price: number;
  duration?: number;
  duration_minutes?: number | null;
  director?: string | null;
  cast_info?: string | null;
  trailer_url?: string;
  category_id?: number;
  category_name?: string | null;
  room?: string | null;
  room_name?: string | null;
  status?: string;
  premiere_date?: string | null;
  on_display_until?: string | null;
  sessions?: Array<{
    id: number;
    session_date: string;
    session_time: string;
    room_name?: string | null;
    room?: string | null;
    language?: string | null;
    available_seats?: number;
  }>;
}

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMovies() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<Movie[]>('/movies');
        console.log('[useMovies] Filmes retornados do backend:', data);
        console.log('[useMovies] Primeiro filme (se existir):', data[0]);
        setMovies(data);
      } catch (err: any) {
        console.error('[useMovies] Erro ao buscar filmes:', err);
        setError(err.message || 'Erro ao carregar filmes.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovies();
  }, []);

  return { movies, isLoading, error, setMovies };
}
