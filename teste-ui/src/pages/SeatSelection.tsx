import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Armchair, Clock, CreditCard, Loader2, Ticket } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type SeatStatus = 'free' | 'occupied' | 'selected';

interface OccupiedSeatsResponse {
  occupied: string[];
  reserved?: Array<{ seat_label: string; expires_at: string }>;
}

interface ReserveSeatsResponse {
  reserved: string[];
  expires_at?: string;
  expires_in_seconds?: number;
}

interface PurchaseTicketsResponse {
  order_id: number;
  payment_id: number;
  total: number;
  tickets: Array<{ seat_label: string; ticket_code: string }>;
  pix?: {
    ticket_url?: string;
    qr_code?: string | null;
    qr_code_base64?: string | null;
  };
}

const seatId = (row: string, col: number) => `${row}${col}`;

function formatDate(value?: string | null) {
  if (!value) return 'Data a definir';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    weekday: 'short',
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}

export default function SeatSelection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const movieId = Number(searchParams.get('movieId'));
  const sessionId = Number(searchParams.get('sessionId'));
  const movieTitle = searchParams.get('movieTitle') || 'Filme';
  const sessionDate = searchParams.get('sessionDate');
  const sessionTime = searchParams.get('sessionTime');
  const roomName = searchParams.get('roomName') || 'Sala a definir';
  const pricePerSeat = Number(searchParams.get('pricePerSeat') || 0);

  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reserveUntil, setReserveUntil] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const isReady = Number.isInteger(movieId) && Number.isInteger(sessionId) && pricePerSeat > 0;
  const total = selectedSeats.length * pricePerSeat;
  const freeCount = ROWS.length * COLS.length - occupiedSeats.length;
  const sortedSelectedSeats = useMemo(() => [...selectedSeats].sort(), [selectedSeats]);

  const loadOccupiedSeats = useCallback(async () => {
    if (!Number.isInteger(sessionId)) return;

    try {
      setIsLoadingSeats(true);
      const data = await api.get<OccupiedSeatsResponse>(`/tickets/occupied/${sessionId}`);
      setOccupiedSeats(data.occupied || []);
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel carregar os assentos.');
    } finally {
      setIsLoadingSeats(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadOccupiedSeats();
  }, [loadOccupiedSeats]);

  useEffect(() => {
    if (!reserveUntil) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const nextSeconds = Math.max(0, Math.ceil((reserveUntil.getTime() - Date.now()) / 1000));
      setSecondsLeft(nextSeconds);

      if (nextSeconds === 0) {
        setReserveUntil(null);
        setSelectedSeats([]);
        loadOccupiedSeats();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [reserveUntil, loadOccupiedSeats]);

  useEffect(() => {
    return () => {
      if (isAuthenticated && Number.isInteger(sessionId)) {
        api.post('/tickets/reservations/release', { session_id: sessionId }).catch(() => undefined);
      }
    };
  }, [isAuthenticated, sessionId]);

  const syncReservation = async (nextSeats: string[]) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setError('');
    setIsReserving(true);

    try {
      if (nextSeats.length === 0) {
        await api.post('/tickets/reservations/release', { session_id: sessionId });
        setReserveUntil(null);
      } else {
        const data = await api.post<ReserveSeatsResponse>('/tickets/reserve', {
          movie_id: movieId,
          session_id: sessionId,
          seats: nextSeats,
        });
        setReserveUntil(data.expires_at ? new Date(data.expires_at) : new Date(Date.now() + 20 * 60 * 1000));
      }

      setSelectedSeats(nextSeats);
      await loadOccupiedSeats();
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel reservar este assento.');
      await loadOccupiedSeats();
    } finally {
      setIsReserving(false);
    }
  };

  const toggleSeat = (seat: string) => {
    if (isReserving || isBuying || occupiedSeats.includes(seat)) return;

    const nextSeats = selectedSeats.includes(seat)
      ? selectedSeats.filter((item) => item !== seat)
      : [...selectedSeats, seat];

    syncReservation(nextSeats);
  };

  const seatStatus = (seat: string): SeatStatus => {
    if (selectedSeats.includes(seat)) return 'selected';
    if (occupiedSeats.includes(seat)) return 'occupied';
    return 'free';
  };

  const handlePurchase = async () => {
    if (selectedSeats.length === 0) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsBuying(true);
    setError('');
    setCheckoutUrl('');

    try {
      const data = await api.post<PurchaseTicketsResponse>('/tickets/purchase', {
        movie_id: movieId,
        session_id: sessionId,
        seats: sortedSelectedSeats,
      });

      setSelectedSeats([]);
      setReserveUntil(null);

      if (data.pix?.ticket_url) {
        setCheckoutUrl(data.pix.ticket_url);
        window.location.href = data.pix.ticket_url;
        return;
      }

      await loadOccupiedSeats();
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel iniciar o pagamento.');
      await loadOccupiedSeats();
    } finally {
      setIsBuying(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-[70vh] pt-32 px-6 flex flex-col items-center justify-center text-center gap-5">
        <h1 className="font-display text-4xl font-black uppercase italic">Sessao indisponivel</h1>
        <p className="text-white/50 max-w-md">
          Nao encontramos uma sessao valida para reservar assentos.
        </p>
        <Link to="/catalog">
          <Button variant="secondary">Voltar ao catalogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-24 pb-36 md:pb-14"
    >
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-10">
          <section className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/45 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>

                <div>
                  <h1 className="font-display text-3xl sm:text-5xl font-black uppercase italic tracking-tighter leading-none">
                    Escolha seus assentos
                  </h1>
                  <p className="mt-3 text-white/55 text-sm sm:text-base">
                    {movieTitle} • {formatDate(sessionDate)} • {sessionTime?.slice(0, 5) || 'Horario a definir'} • {roomName}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[10px] uppercase tracking-widest text-white/35 font-bold">Livres</span>
                <strong className="font-display text-3xl text-cinema-gold">{freeCount}</strong>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-cinema-red/40 bg-cinema-red/10 px-5 py-4 text-sm text-cinema-red font-bold">
                {error}
              </div>
            ) : null}

            <div className="glass-card rounded-3xl p-4 sm:p-8 overflow-hidden">
              <div className="relative mx-auto max-w-3xl pb-5 pt-2">
                <div className="mx-auto h-2 w-4/5 rounded-full bg-cinema-red/70 shadow-[0_0_35px_rgba(229,9,20,0.55)]" />
                <p className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.6em] text-white/35">
                  Tela
                </p>
              </div>

              {isLoadingSeats ? (
                <div className="min-h-[320px] flex flex-col items-center justify-center gap-4 text-white/50">
                  <Loader2 className="w-8 h-8 animate-spin text-cinema-red" />
                  Carregando assentos...
                </div>
              ) : (
                <div className="mx-auto w-full max-w-[720px] overflow-x-auto pb-2">
                  <div className="min-w-[520px] sm:min-w-0 space-y-2 px-1">
                    {ROWS.map((row) => (
                      <div key={row} className="grid grid-cols-[24px_repeat(5,minmax(32px,1fr))_16px_repeat(5,minmax(32px,1fr))] gap-1.5 sm:gap-2 items-center">
                        <span className="text-xs font-black text-white/35 text-center">{row}</span>
                        {COLS.map((col) => {
                          const seat = seatId(row, col);
                          const status = seatStatus(seat);

                          return (
                            <button
                              key={seat}
                              type="button"
                              disabled={status === 'occupied' || isReserving || isBuying}
                              onClick={() => toggleSeat(seat)}
                              className={[
                                col === 6 ? 'col-start-8' : '',
                                'group h-10 sm:h-12 rounded-lg border text-[10px] sm:text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5',
                                status === 'free' ? 'bg-white/[0.07] border-white/10 text-white/55 hover:border-cinema-red/60 hover:text-white' : '',
                                status === 'selected' ? 'bg-cinema-red border-cinema-red text-white shadow-[0_0_18px_rgba(229,9,20,0.45)] -translate-y-0.5' : '',
                                status === 'occupied' ? 'bg-[#2a1010] border-[#3a1818] text-cinema-red/35 cursor-not-allowed opacity-80' : '',
                              ].join(' ')}
                              aria-label={`Assento ${seat}`}
                            >
                              <Armchair className="w-4 h-4" />
                              {seat}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/50">
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-white/[0.07] border border-white/10" />
                  Livre
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-cinema-red border border-cinema-red" />
                  Selecionado
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-[#2a1010] border border-[#3a1818]" />
                  Ocupado ou reservado
                </span>
              </div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-28 h-fit space-y-4">
            <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Compra</span>
                  <h2 className="font-display text-2xl font-black uppercase italic">Resumo</h2>
                </div>
                <Ticket className="w-7 h-7 text-cinema-red" />
              </div>

              <div className="rounded-2xl bg-black/25 border border-white/10 p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-white/45">Ingresso</span>
                  <strong>{formatCurrency(pricePerSeat)}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-white/45">Assentos</span>
                  <strong>{sortedSelectedSeats.length ? sortedSelectedSeats.join(', ') : '-'}</strong>
                </div>
                <div className="pt-3 mt-3 border-t border-white/10 flex justify-between gap-3">
                  <span className="text-white/55 font-bold">Total</span>
                  <strong className="text-cinema-gold text-lg">{formatCurrency(total)}</strong>
                </div>
              </div>

              {secondsLeft > 0 ? (
                <div className="rounded-2xl border border-cinema-gold/30 bg-cinema-gold/10 p-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-cinema-gold" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-cinema-gold font-black">
                      Reserva ativa
                    </span>
                    <strong className="font-display text-2xl">{formatTimer(secondsLeft)}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/45 leading-relaxed">
                  Ao escolher um assento, ele fica reservado para voce por 20 minutos enquanto finaliza a compra.
                </p>
              )}

              <Button
                className="w-full rounded-2xl py-4"
                disabled={selectedSeats.length === 0 || isBuying || isReserving}
                onClick={handlePurchase}
              >
                {isBuying || isReserving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {selectedSeats.length === 0 ? 'Selecione assentos' : 'Ir para pagamento'}
              </Button>

              {checkoutUrl ? (
                <a href={checkoutUrl} className="block text-center text-xs text-cinema-red hover:text-white transition-colors">
                  Abrir pagamento novamente
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden bg-cinema-black/95 border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-white/35 font-black">
              {selectedSeats.length ? `${selectedSeats.length} assento(s)` : 'Escolha seus assentos'}
            </p>
            <strong className="font-display text-xl text-cinema-gold">{formatCurrency(total)}</strong>
            {secondsLeft > 0 ? <p className="text-[11px] text-cinema-gold">Reserva {formatTimer(secondsLeft)}</p> : null}
          </div>
          <Button
            className="rounded-2xl px-5 py-3"
            disabled={selectedSeats.length === 0 || isBuying || isReserving}
            onClick={handlePurchase}
          >
            {isBuying || isReserving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pagar'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
