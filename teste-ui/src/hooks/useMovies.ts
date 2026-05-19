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
  trailer_url?: string;
  category_id?: number;
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
        setMovies(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar filmes.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovies();
  }, []);

  return { movies, isLoading, error, setMovies };
}
