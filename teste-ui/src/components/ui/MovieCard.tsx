import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from './Button';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { hasRole, STAFF_ROLES } from '../../lib/roles';

interface MovieCardProps {
  key?: React.Key;
  movie: {
    id: number;
    title: string;
    description: string;
    genre: string;
    rating: string;
    poster_url: string | null;
    session_date?: string;
    session_time?: string;
    price?: number;
    duration_minutes?: number;
  };
  className?: string;
  onDeleted?: (movieId: number) => void;
}

export function MovieCard({ movie, className, onDeleted }: MovieCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const isSeller = hasRole(user?.role, STAFF_ROLES);
  const moviePath = `/movies/${movie.id}`;

  const handleDelete = async () => {
    const confirmed = window.confirm(`Deseja apagar "${movie.title}"?`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.delete(`/movies/${movie.id}`);
      onDeleted?.(movie.id);
    } catch (error: any) {
      window.alert(error?.message || 'Nao foi possivel apagar este filme.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openMovie = () => navigate(moviePath);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openMovie();
    }
  };

  // Variantes para sincronizar com o MovieGrid (Antigravity)
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98] as const // Ease Out suave (Quart)
      }
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      role="button"
      tabIndex={0}
      onClick={openMovie}
      onKeyDown={handleKeyDown}
      className={cn('group relative glass-card flex flex-col overflow-hidden h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-cinema-red/60', className)}
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={(movie.poster_url && movie.poster_url.startsWith('http')) ? movie.poster_url : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop'}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent opacity-60" />
        
        {/* Rating Badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold border border-white/10 uppercase tracking-widest leading-none">
          {movie.rating}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="space-y-1">
          <h3 className="font-display text-xl font-bold leading-tight group-hover:text-cinema-red transition-colors line-clamp-1">
            {movie.title}
          </h3>
          <p className="text-cinema-red text-[10px] font-bold uppercase tracking-wider">
            {movie.genre}
          </p>
        </div>

        <p className="text-white/60 text-xs line-clamp-2 leading-relaxed">
          {movie.description}
        </p>

        <div className="mt-auto space-y-4 pt-2">
          {/* Metadata */}
          <div className="flex items-center justify-between text-white/50 text-[10px] font-medium uppercase tracking-tighter">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-cinema-red" />
              <span>{movie.session_date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-cinema-red" />
              <span>{movie.session_time}</span>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Ingresso</span>
              <span className="text-lg font-display font-bold text-cinema-gold">
                {movie.price === 0 || !movie.price ? 'Grátis' : `R$ ${Number(movie.price).toFixed(2)}`}
              </span>
            </div>
            {isSeller ? (
              <div className="flex items-center gap-2">
                <Link to={`/admin/movies/edit/${movie.id}`} onClick={(event) => event.stopPropagation()}>
                  <Button size="sm" variant="glass" className="rounded-xl p-2.5 flex items-center justify-center border border-white/10 hover:border-cinema-red transition-colors w-9 h-9">
                    <Pencil className="w-4 h-4 text-white" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="glass"
                  className="rounded-xl p-2.5 flex items-center justify-center border border-white/10 hover:border-cinema-red transition-colors w-9 h-9"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  aria-label={`Apagar ${movie.title}`}
                  title="Apagar filme"
                >
                  <Trash2 className="w-4 h-4 text-cinema-red" />
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl px-4 py-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    openMovie();
                  }}
                >
                  Reservar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="rounded-xl px-4 py-2"
                onClick={(event) => {
                  event.stopPropagation();
                  openMovie();
                }}
              >
                Reservar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hover Overglow effect (Antigravity) */}
      <motion.div 
        className="absolute inset-x-0 -bottom-1 h-1 bg-cinema-red shadow-[0_0_20px_2px_rgba(229,9,20,0.4)] opacity-0 group-hover:opacity-100 transition-opacity"
        layoutId={`underline-${movie.id}`}
      />
    </motion.div>
  );
}
