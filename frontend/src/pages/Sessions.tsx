/**
 * Sessions.tsx - Página de sessões conectada à API.
 *
 * Busca as sessões reais do backend via hook useSessions.
 */

import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useSessions } from '../hooks/useSessions';

const DATE_FILTER_DAYS = 7;
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const toLocalIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (date: Date) => `${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`;

const formatWeekdayLabel = (date: Date, offset: number) => {
  if (offset === 0) return 'Hoje';
  if (offset === 1) return 'Amanhã';

  return WEEKDAY_LABELS[date.getDay()];
};

const buildDateFilters = () => {
  const today = new Date();

  return Array.from({ length: DATE_FILTER_DAYS }, (_, offset) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(today.getDate() + offset);

    return {
      day: formatWeekdayLabel(date, offset),
      date: formatDateLabel(date),
      value: toLocalIsoDate(date),
    };
  });
};

const formatSessionDate = (value?: string) => {
  if (!value) return 'Data a definir';

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  return formatDateLabel(new Date(year, month - 1, day, 12));
};

export default function Sessions() {
  const { sessions, isLoading, error } = useSessions();
  const [search, setSearch] = useState('');
  const [activeDate, setActiveDate] = useState(0);
  const dateFilters = useMemo(buildDateFilters, []);

  const filteredSessions = useMemo(() => {
    const selectedDate = dateFilters[activeDate]?.value;
    const searchTerm = search.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesDate = !selectedDate || session.date === selectedDate;
      const matchesSearch =
        !searchTerm ||
        session.movie.toLowerCase().includes(searchTerm) ||
        session.room.toLowerCase().includes(searchTerm) ||
        session.lang.toLowerCase().includes(searchTerm) ||
        session.type.toLowerCase().includes(searchTerm);

      return matchesDate && matchesSearch;
    });
  }, [activeDate, dateFilters, sessions, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24 space-y-12"
    >
      <div className="space-y-4">
        <h1 className="font-display text-5xl font-black uppercase italic tracking-tighter">
          Próximas <span className="text-cinema-red text-glow">Sessões</span>
        </h1>
        <p className="text-white/50 max-w-xl">
          Reserve seu lugar nas melhores salas de cinema. Filtre por data, idioma ou tipo de exibição.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dateFilters.map((d, i) => (
            <Button
              key={d.value}
              variant={activeDate === i ? 'primary' : 'glass'}
              size="sm"
              className="rounded-2xl flex flex-col items-center py-3 min-w-[80px] shrink-0"
              onClick={() => setActiveDate(i)}
            >
              <span className="text-[10px] opacity-70">{d.day}</span>
              <span className="text-sm font-bold">{d.date}</span>
            </Button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por filme ou sala..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors"
          />
        </div>
      </div>

      {isLoading && <Spinner message="Carregando sessões..." />}
      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}

      {!isLoading && !error && (
        <div className="grid gap-4">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-16 text-white/30 text-sm font-bold uppercase tracking-widest">
              Nenhuma sessão encontrada.
            </div>
          ) : (
            filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                whileHover={{ x: 10 }}
                className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-8 group"
              >
                <div className="flex items-center gap-8 flex-1 w-full">
                  <div className="w-20 text-center space-y-1">
                    <Clock className="w-4 h-4 text-cinema-red mx-auto" />
                    <span className="text-2xl font-display font-black text-glow block">{session.time}</span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <h3 className="text-xl font-bold font-display uppercase tracking-tight group-hover:text-cinema-red transition-colors">
                      {session.movie}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-cinema-red" />
                        {formatSessionDate(session.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-cinema-red" />
                        {session.room}
                      </span>
                      <span>{session.lang}</span>
                      <span className="text-cinema-gold">{session.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <Button variant="ghost" size="sm" className="flex-1 md:flex-none">
                    Ver Detalhes
                  </Button>
                  <Button variant="primary" className="flex-1 md:flex-none px-8">
                    Comprar
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
