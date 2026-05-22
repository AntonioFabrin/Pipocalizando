import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Copy,
  Film,
  Loader2,
  ShieldCheck,
  Ticket,
  CalendarDays,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

interface MyTicket {
  ticket_id: number;
  ticket_code: string;
  seat_label?: string | null;
  is_used: boolean;
  used_at?: string | null;
  ticket_issued_at?: string | null;
  order_id: number;
  order_total: number;
  order_status: string;
  order_created_at?: string | null;
  customer_name: string;
  customer_email: string;
  payment_status?: string | null;
  payment_method?: string | null;
  paid_at?: string | null;
  session_date?: string | null;
  session_time?: string | null;
  room_name?: string | null;
  movie: {
    title: string;
    genre?: string | null;
    poster_url?: string | null;
    price?: number;
  };
  seats: string[];
}

type TicketGroup = {
  order_id: number;
  movie_title: string;
  movie_genre?: string | null;
  poster_url?: string | null;
  room_name?: string | null;
  session_date?: string | null;
  session_time?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  order_status: string;
  order_total: number;
  order_created_at?: string | null;
  paid_at?: string | null;
  tickets: MyTicket[];
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatCurrency = (value?: number | string | null) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const STATUS_TONES: Record<string, string> = {
  approved: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  pending: 'text-cinema-gold bg-cinema-gold/10 border-cinema-gold/30',
  cancelled: 'text-red-300 bg-red-500/10 border-red-500/30',
  rejected: 'text-red-300 bg-red-500/10 border-red-500/30',
};

function TicketCard({ group }: { group: TicketGroup }) {
  const primaryTicket = group.tickets[0];
  const statusTone = STATUS_TONES[group.payment_status || 'pending'] || STATUS_TONES.pending;

  return (
    <article className="glass-card overflow-hidden border border-white/10">
      <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative min-h-[260px] overflow-hidden bg-black/30">
          {primaryTicket.movie.poster_url ? (
            <img
              src={primaryTicket.movie.poster_url}
              alt={primaryTicket.movie.title}
              className="absolute inset-0 h-full w-full object-cover brightness-[0.55]"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(229,9,20,0.24),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/65 to-transparent" />

          <div className="relative z-10 flex h-full min-h-[260px] flex-col justify-between p-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
              <ShieldCheck className="h-4 w-4 text-cinema-red" />
              Ingresso confirmado no seu histórico
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/60 backdrop-blur">
                <Film className="h-3.5 w-3.5 text-cinema-red" />
                {primaryTicket.movie.genre || 'Cinema'}
              </div>

              <h2 className="font-display text-3xl font-black uppercase italic tracking-tighter">
                {primaryTicket.movie.title}
              </h2>

              <div className="flex flex-wrap gap-2">
                {group.tickets.map((ticket) => (
                  <span
                    key={ticket.ticket_id}
                    className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/75 backdrop-blur"
                  >
                    Assento {ticket.seat_label || '-'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${statusTone}`}>
              {group.payment_status || 'pending'}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/55">
              Pedido #{group.order_id}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/55">
              {group.payment_method || 'pix'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Sessão</p>
              <p className="mt-2 font-display text-xl font-black uppercase italic tracking-tight">
                {formatDate(group.session_date)} • {group.session_time || '-'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Sala</p>
              <p className="mt-2 font-display text-xl font-black uppercase italic tracking-tight">
                {group.room_name || '-'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Compra</p>
              <p className="mt-2 text-sm text-white/70">
                {formatDateTime(group.paid_at || group.order_created_at)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Total</p>
              <p className="mt-2 font-display text-2xl font-black text-cinema-gold">
                {formatCurrency(group.order_total)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Código do ingresso</p>
                <p className="mt-2 font-mono text-lg font-black tracking-[0.35em] text-white">
                  {primaryTicket.ticket_code}
                </p>
              </div>
              <Ticket className="h-6 w-6 text-cinema-red" />
            </div>
            <p className="mt-3 text-xs text-white/40">
              O código acima pode ser validado na entrada do cinema.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Ingressos no pedido</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.tickets.map((ticket) => (
                <span
                  key={`${ticket.ticket_id}-seat`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75"
                >
                  {ticket.seat_label || '-'} • {ticket.is_used ? 'usado' : 'válido'}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="glass"
              onClick={async () => {
                await navigator.clipboard.writeText(primaryTicket.ticket_code);
              }}
            >
              <Copy className="h-4 w-4" />
              Copiar código
            </Button>
            <Link to="/sessions">
              <Button variant="secondary">
                <ChevronRight className="h-4 w-4" />
                Ver sessões
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTickets() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<MyTicket[]>('/tickets/mine');
        if (!mounted) return;
        setTickets(data);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Erro ao carregar os ingressos.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadTickets();

    return () => {
      mounted = false;
    };
  }, []);

  const groups = useMemo<TicketGroup[]>(() => {
    const map = new Map<number, TicketGroup>();

    tickets.forEach((ticket) => {
      const existing = map.get(ticket.order_id);
      if (existing) {
        existing.tickets.push(ticket);
        return;
      }

      map.set(ticket.order_id, {
        order_id: ticket.order_id,
        movie_title: ticket.movie.title,
        movie_genre: ticket.movie.genre,
        poster_url: ticket.movie.poster_url,
        room_name: ticket.room_name,
        session_date: ticket.session_date,
        session_time: ticket.session_time,
        payment_status: ticket.payment_status,
        payment_method: ticket.payment_method,
        order_status: ticket.order_status,
        order_total: ticket.order_total,
        order_created_at: ticket.order_created_at,
        paid_at: ticket.paid_at,
        tickets: [ticket],
      });
    });

    return Array.from(map.values());
  }, [tickets]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl px-6 pb-24 pt-32 lg:px-12"
    >
      <section className="mb-10 rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(229,9,20,0.18),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))] p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cinema-red text-white shadow-[0_0_30px_rgba(229,9,20,0.35)]">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cinema-red">Minha carteira</p>
                <p className="text-sm text-white/45">Ingressos comprados e comprovantes do cliente</p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-5xl font-black uppercase italic tracking-tighter md:text-7xl">
                Meus <span className="text-cinema-red">ingressos</span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
                Aqui o cliente encontra o código de cada ingresso, assento comprado, sessão, sala e data da compra.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-card p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/35">Pedidos</p>
              <p className="mt-2 font-display text-3xl font-black uppercase italic tracking-tight">{groups.length}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/35">Ingressos</p>
              <p className="mt-2 font-display text-3xl font-black uppercase italic tracking-tight">{tickets.length}</p>
            </div>
          </div>
        </div>
      </section>

      {isLoading && <Spinner message="Carregando seus ingressos..." />}
      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}

      {!isLoading && !error && (
        <div className="space-y-5">
          {groups.length > 0 ? (
            groups.map((group) => <TicketCard key={group.order_id} group={group} />)
          ) : (
            <div className="glass-card py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cinema-red/15 text-cinema-red">
                <Loader2 className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-black uppercase italic tracking-tighter">
                Nenhum ingresso encontrado
              </h2>
              <p className="mt-3 text-sm text-white/50">
                Quando você comprar um ingresso, ele vai aparecer aqui com o código de validação.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/sessions">
                  <Button>
                    <CalendarDays className="h-4 w-4" />
                    Ver sessões
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="glass">
                    <MapPin className="h-4 w-4" />
                    Bomboniere
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
