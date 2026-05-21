import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Film,
  MapPin,
  Play,
  Star,
  Ticket,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import api from '../services/api';
import type { Movie } from '../hooks/useMovies';

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop';

function formatDate(value?: string | null) {
  if (!value) return 'Data em breve';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    weekday: 'short',
  }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return 'Horario em breve';
  return value.slice(0, 5);
}

function formatPrice(value?: number | string | null) {
  const price = Number(value || 0);
  if (!price) return 'Gratis';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMovie() {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<Movie>(`/movies/${id}`);
        setMovie(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar filme.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovie();
  }, [id]);

  const sessions = useMemo(() => {
    if (!movie) return [];
    return movie.sessions || [];
  }, [movie]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-24">
        <Spinner message="Carregando filme..." />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <ErrorMessage message={error || 'Filme nao encontrado.'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const poster = movie.poster_url || FALLBACK_POSTER;
  const tags = [movie.category_name, movie.genre].filter(Boolean).join(' / ');
  const goToSeats = (session: NonNullable<Movie['sessions']>[number]) => {
    const params = new URLSearchParams({
      movieId: String(movie.id),
      sessionId: String(session.id),
      movieTitle: movie.title,
      sessionDate: session.session_date || movie.session_date || '',
      sessionTime: session.session_time || movie.session_time || '',
      roomName: session.room_name || session.room || movie.room_name || movie.room || 'Sala a definir',
      pricePerSeat: String(Number(movie.price || 0)),
    });

    navigate(`/seats?${params.toString()}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24">
      <section className="relative min-h-[78vh] pt-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src={poster} alt="" className="w-full h-full object-cover brightness-[0.28] blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/80 to-cinema-black/30" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-cinema-black to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[330px_1fr] gap-12 items-end min-h-[68vh]">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="hidden lg:block rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
          >
            <img src={poster} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
          </motion.div>

          <div className="max-w-3xl space-y-8">
            <Link to="/catalog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao catalogo
            </Link>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
                <span className="bg-cinema-red text-white px-3 py-1.5 rounded-lg">{movie.rating}</span>
                {movie.duration_minutes ? (
                  <span className="text-white/60">{movie.duration_minutes} min</span>
                ) : null}
                {movie.status ? (
                  <span className="text-cinema-gold">{movie.status.replace('_', ' ')}</span>
                ) : null}
              </div>

              <h1 className="font-display text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9]">
                {movie.title}
              </h1>

              {tags ? (
                <p className="text-cinema-red text-xs font-black uppercase tracking-[0.22em]">
                  {tags}
                </p>
              ) : null}

              <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-2xl">
                {movie.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="rounded-2xl px-9"
                onClick={() => document.getElementById('sessions')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Ticket className="w-4 h-4" />
                Reservar ingresso
              </Button>
              {movie.trailer_url ? (
                <Button
                  variant="glass"
                  size="lg"
                  className="rounded-2xl px-9"
                  onClick={() => window.open(movie.trailer_url || '', '_blank', 'noopener,noreferrer')}
                >
                  <Play className="w-4 h-4" />
                  Trailer
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 space-y-16">
        <section className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Calendar, label: 'Estreia', value: formatDate(movie.premiere_date || movie.session_date) },
            { icon: Clock, label: 'Duracao', value: movie.duration_minutes ? `${movie.duration_minutes} min` : 'Em breve' },
            { icon: MapPin, label: 'Sala', value: movie.room_name || movie.room || 'A definir' },
            { icon: Star, label: 'Ingresso', value: formatPrice(movie.price) },
          ].map((item) => (
            <div key={item.label} className="glass-card p-5 rounded-2xl">
              <item.icon className="w-5 h-5 text-cinema-red mb-4" />
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest block">{item.label}</span>
              <strong className="text-white font-display text-xl">{item.value}</strong>
            </div>
          ))}
        </section>

        <section className="grid lg:grid-cols-[1fr_360px] gap-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-cinema-red font-bold uppercase tracking-widest text-[10px]">Sobre o filme</span>
              <h2 className="font-display text-4xl font-black uppercase italic tracking-tighter">Sinopse</h2>
              <p className="text-white/65 leading-relaxed">{movie.description}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="glass-card p-6 rounded-2xl">
                <Film className="w-5 h-5 text-cinema-red mb-4" />
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest block">Direcao</span>
                <strong className="text-white">{movie.director || 'Nao informado'}</strong>
              </div>
              <div className="glass-card p-6 rounded-2xl">
                <Users className="w-5 h-5 text-cinema-red mb-4" />
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest block">Elenco</span>
                <strong className="text-white">{movie.cast_info || 'Nao informado'}</strong>
              </div>
            </div>
          </div>

          <aside id="sessions" className="space-y-4 scroll-mt-28">
            <div className="space-y-2">
              <span className="text-cinema-red font-bold uppercase tracking-widest text-[10px]">Escolha sua sessao</span>
              <h2 className="font-display text-3xl font-black uppercase italic tracking-tighter">Horarios</h2>
            </div>

            {sessions.length === 0 ? (
              <div className="glass-card p-6 rounded-2xl text-white/50 text-sm">
                Nenhuma sessao disponivel no momento.
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="glass-card p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest block">
                        {formatDate(session.session_date)}
                      </span>
                      <strong className="font-display text-3xl text-glow">{formatTime(session.session_time)}</strong>
                    </div>
                    <span className="text-[10px] uppercase font-black text-cinema-gold">
                      {session.language || 'dublado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{session.room_name || session.room || movie.room_name || 'Sala a definir'}</span>
                    {session.available_seats ? <span>{session.available_seats} lugares</span> : null}
                  </div>

                  <Button className="w-full rounded-xl" onClick={() => goToSeats(session)}>
                    <Ticket className="w-4 h-4" />
                    Reservar
                  </Button>
                </div>
              ))
            )}
          </aside>
        </section>
      </main>
    </motion.div>
  );
}
