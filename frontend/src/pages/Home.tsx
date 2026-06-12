/**
 * Home.tsx — Página principal conectada à API
 *
 * Agente responsável: Desenvolvedor Frontend
 *
 * Busca os filmes em destaque do backend via hook useMovies.
 * Dados estáticos substituídos por dados dinâmicos da API.
 * Fallback para dados estáticos caso a API esteja offline.
 */

import { motion } from 'motion/react';
import { MovieGrid } from '../components/ui/MovieGrid';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { ChevronRight, Play } from 'lucide-react';
import { useMovies } from '../hooks/useMovies';
import { Link } from 'react-router-dom';

export default function Home() {
  const { movies, isLoading, setMovies } = useMovies();
  
  // Pega os primeiros 4 filmes como destaque
  const featuredMovies = movies.slice(0, 4);
  const heroMovie = featuredMovies[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Image with Blur/Atmosphere */}
        <div className="absolute inset-0">
          <img 
            src={heroMovie?.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop'} 
            alt="Hero Background" 
            className="w-full h-full object-cover blur-[1px] brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-cinema-black/40" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-cinema-black to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="max-w-2xl space-y-8">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-0.5 bg-cinema-red" />
              <span className="text-cinema-red font-bold uppercase tracking-[0.3em] text-xs">
                Em Destaque Agora
              </span>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-display text-7xl md:text-8xl font-black uppercase italic leading-[0.85] tracking-tighter"
            >
              {heroMovie ? (
                <>
                  {heroMovie.title.split(' ')[0]} <br />
                  <span className="text-glow">{heroMovie.title.split(' ').slice(1).join(' ') || heroMovie.title}</span>
                </>
              ) : (
                <>
                  Pipoca<br />
                  <span className="text-glow">lizando</span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/70 text-lg leading-relaxed max-w-lg"
            >
              {heroMovie?.description ||
                'Uma jornada épica entre o amor e o infinito. Descubra o que existe além do horizonte de eventos nesta experiência cinematográfica sem precedentes.'}
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <Button size="lg" className="group">
                <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-125" />
                Assistir Trailer
              </Button>
              <Link to="/sessions">
                <Button variant="glass" size="lg" className="px-10">
                  Garantir Ingresso
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-24 space-y-32">
        
        {/* Sessions Filter / Section Header */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <span className="text-cinema-red font-bold uppercase tracking-widest text-[10px]">
                Cinemas Pipocalizando
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter">
                Sessões em <span className="italic text-glow">Cartaz</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/catalog">
                <Button variant="secondary" size="sm" className="bg-white/10 active:bg-cinema-red/20 transition-colors">
                  Ver Todas
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <Spinner message="Carregando filmes..." />
          ) : (
            <MovieGrid
              movies={featuredMovies.length > 0 ? featuredMovies : []}
              onMovieDeleted={(movieId) => setMovies((current) => current.filter((movie) => movie.id !== movieId))}
            />
          )}
        </section>

        {/* Combos Section */}
        <section className="glass rounded-[3rem] p-12 md:p-20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-cinema-red/10 blur-[120px] pointer-events-none" />
          
          <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
            <div className="space-y-8">
              <h2 className="font-display text-5xl md:text-6xl font-black uppercase leading-[0.9] tracking-tighter italic">
                A Dupla <br />
                <span className="text-glow text-cinema-red">Perfeita</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed">
                Nenhum filme está completo sem a nossa pipoca especial. Conheça nossos novos combos premium com refil ilimitado de felicidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="primary" className="rounded-2xl">
                  Escolher Combo
                </Button>
                <Link to="/products">
                  <Button size="lg" variant="ghost" className="text-cinema-red hover:text-white uppercase tracking-widest text-xs font-black italic">
                    Ver Cardápio Completo
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative aspect-square md:aspect-auto">
              <motion.div
                whileHover={{ rotate: 12, scale: 1.05 }}
                className="relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <img 
                  src="/images/popcorn-combo.png"
                  alt="Popcorn Combo" 
                  className="w-full h-full object-cover rounded-3xl border border-white/10"
                />
              </motion.div>
              <div className="absolute -inset-4 bg-cinema-red/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </section>
      </main>
    </motion.div>
  );
}
