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

const CATEGORIES = ['Todos', 'Ação', 'Ficção', 'Animação', 'Terror', 'Suspense', 'Drama'];

export default function Catalog() {
  const { movies, isLoading, error } = useMovies();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const isSeller = user?.role === 'admin' || user?.role === 'seller';

  const filteredMovies = useMemo(() => {
    let result = movies;

    if (search.trim()) {
      result = result.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (activeCategory !== 'Todos') {
      result = result.filter((m) =>
        m.genre?.toLowerCase().includes(activeCategory.toLowerCase())
      );
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
        {CATEGORIES.map((cat) => (
          <Button 
            key={cat} 
            variant={activeCategory === cat ? 'primary' : 'secondary'} 
            size="sm" 
            className="rounded-xl whitespace-nowrap px-6"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {isLoading && <Spinner message="Carregando filmes..." />}
      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}
      {!isLoading && !error && <MovieGrid movies={filteredMovies} />}
    </motion.div>
  );
}
