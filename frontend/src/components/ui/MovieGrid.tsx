import { motion } from 'motion/react';
import { MovieCard } from './MovieCard';
import { cn } from '@/src/lib/utils';

interface MovieGridProps {
  movies: any[];
  className?: string;
  onMovieDeleted?: (movieId: number) => void;
}

export function MovieGrid({ movies, className, onMovieDeleted }: MovieGridProps) {
  // Configuração do Antigravity para animação em cascata (Stagger)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Delay entre a aparição de cada card
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        // Grid Responsivo: 1 col no mobile, 2 no tablet, 4 no desktop
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10",
        className
      )}
    >
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onDeleted={onMovieDeleted} />
      ))}
    </motion.div>
  );
}
