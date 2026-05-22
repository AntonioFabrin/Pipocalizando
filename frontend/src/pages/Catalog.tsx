/**
 * Catalog.tsx — Página de Catálogo conectada à API
 *
 * Agente responsável: Desenvolvedor Frontend
 *
 * Busca os filmes reais do backend via hook useMovies.
 * Dados estáticos substituídos por dados dinâmicos da API.
 */

import { motion } from 'motion/react';
import { MovieGrid } from '../components/ui/MovieGrid';
import { Spinner } from '../components/ui/Spinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Search, Filter, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useMovies } from '../hooks/useMovies';
import { useAuth } from '../contexts/AuthContext';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { hasRole, STAFF_ROLES } from '../lib/roles';

const ALL_CATEGORIES = 'all';
const FALLBACK_CATEGORIES = ['Ação', 'Ficção', 'Animação', 'Terror', 'Suspense', 'Drama'];

const normalizeText = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const splitMovieTags = (value?: string | null) =>
  (value || '')
    .split(/[,;/|]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

const getMovieTags = (movie: { category_name?: string | null; genre?: string | null }) => [
  ...splitMovieTags(movie.category_name),
  ...splitMovieTags(movie.genre),
];

export default function Catalog() {
  const { movies, isLoading, error, setMovies } = useMovies();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);

  const isSeller = hasRole(user?.role, STAFF_ROLES);

  const categories = useMemo(() => {
    const names = movies
      .flatMap(getMovieTags)
      .filter((name) => Boolean(name.trim()));

    const uniqueCategories = new Map<string, string>();
    [...names, ...FALLBACK_CATEGORIES].forEach((name) => {
      const key = normalizeText(name);
      if (key && !uniqueCategories.has(key)) {
        uniqueCategories.set(key, name);
      }
    });

    return ['Todos', ...Array.from(uniqueCategories.values())];
  }, [movies]);

  const filteredMovies = useMemo(() => {
    let result = movies;
    const normalizedSearch = normalizeText(search);

    if (normalizedSearch) {
      result = result.filter((m) =>
        normalizeText(m.title).includes(normalizedSearch)
      );
    }

    if (activeCategory !== ALL_CATEGORIES) {
      result = result.filter((m) => {
        const tags = getMovieTags(m).map(normalizeText);

        return tags.includes(activeCategory);
      });
    }

    return result;
  }, [movies, search, activeCategory]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24 space-y-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <h1 className="font-display text-5xl font-black uppercase italic tracking-tighter">
            Todos os <span className="text-cinema-red text-glow">Filmes</span>
          </h1>
          <p className="text-white/50 max-w-xl">
             Explore nosso catálogo completo. De grandes blockbusters a produções independentes premiadas.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {isSeller && (
            <Link to="/admin/movies/new">
              <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                <Button variant="primary" size="sm" className="w-10 h-10 rounded-full p-0 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </Button>
              </motion.div>
            </Link>
          )}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Buscar filme..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors w-[260px]"
            />
          </div>
          <Button variant="glass" size="sm" className="p-3">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((cat) => {
          const categoryValue = cat === 'Todos' ? ALL_CATEGORIES : normalizeText(cat);

          return (
          <Button 
            key={cat} 
            type="button"
            variant={activeCategory === categoryValue ? 'primary' : 'secondary'} 
            size="sm" 
            className="rounded-xl whitespace-nowrap px-6"
            onClick={() => setActiveCategory(categoryValue)}
          >
            {cat}
          </Button>
          );
        })}
      </div>

      {isLoading && <Spinner message="Carregando filmes..." />}
      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}
      {!isLoading && !error && (
        filteredMovies.length > 0 ? (
          <MovieGrid
            key={`${activeCategory}-${filteredMovies.map((movie) => movie.id).join('-')}`}
            movies={filteredMovies}
            onMovieDeleted={(movieId) => setMovies((current) => current.filter((movie) => movie.id !== movieId))}
          />
        ) : (
          <div className="min-h-[320px] flex items-center justify-center text-center text-white/50">
            Nenhum filme encontrado para este filtro.
          </div>
        )
      )}
    </motion.div>
  );
}
