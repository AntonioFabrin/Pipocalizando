import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock3, Film, LoaderCircle, Ticket, ShoppingCart } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';

interface OrderSummary {
  id: number;
  ticket_code?: string | null;
  ticket_issued_at?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  total: number;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

export default function CartReturn() {
  const [searchParams] = useSearchParams();
  const orderId = Number(searchParams.get('order_id'));
  const source = searchParams.get('source');
  const { clearCart } = useCart();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [message, setMessage] = useState('Verificando pagamento...');
  const [isLoading, setIsLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setMessage('Pedido nao identificado.');
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const poll = async () => {
      try {
        const [payment, orders] = await Promise.all([
          api.get<{ status?: string; order_status?: string; amount?: number }>(`/payments/order/${orderId}/status`),
          api.get<OrderSummary[]>('/orders'),
        ]);
        if (!mounted) return;

        const currentOrder = orders.find((item) => item.id === orderId) || null;
        setOrder(currentOrder);

        if (payment.status === 'approved' || currentOrder?.payment_status === 'approved') {
          setIsApproved(true);
          setMessage('Pagamento aprovado. O pedido foi confirmado e o ticket foi liberado.');
          clearCart();
          window.localStorage.removeItem('pending_order_id');
          return;
        }

        setMessage('Pagamento ainda em processamento. Quando o status virar approved, o backend confirma o pedido e libera o ticket automaticamente.');
      } catch (error: any) {
        if (!mounted) return;
        setMessage(error?.message || 'Nao foi possivel verificar o pagamento.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    poll();
    const interval = window.setInterval(poll, 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [clearCart, orderId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl px-6 pb-24 pt-32"
    >
      <section className="glass-card space-y-6 rounded-[2rem] p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cinema-red/15 text-cinema-red">
            {isApproved ? <CheckCircle2 className="h-6 w-6" /> : <LoaderCircle className="h-6 w-6 animate-spin" />}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cinema-red">Pagamento</p>
            <h1 className="font-display text-4xl font-black uppercase italic tracking-tighter">
              {isApproved ? 'Confirmado' : 'Aguardando confirmação'}
            </h1>
          </div>
        </div>

        <p className="text-sm text-white/55">{message}</p>

        {!isApproved && (
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            Enquanto o pagamento nao e confirmado, o pedido continua pendente. Depois da aprovacao, o sistema confirma
            a compra, libera o ticket e ajusta o estoque no backend.
          </div>
        )}

        {order && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Pedido</p>
              <p className="mt-2 font-display text-2xl font-black">#{order.id}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Valor</p>
              <p className="mt-2 font-display text-2xl font-black text-cinema-gold">{formatCurrency(order.total)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Status</p>
              <p className="mt-2 font-display text-2xl font-black text-emerald-300">
                {order.payment_status || 'pending'}
              </p>
            </div>
          </div>
        )}

        {order?.ticket_code && (
          <div className="rounded-[1.75rem] border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-100">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5" />
              <p className="text-sm font-black uppercase tracking-[0.25em]">Ticket emitido</p>
            </div>
            <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
              <span>Código: {order.ticket_code}</span>
              <span>Emitido em: {formatDateTime(order.ticket_issued_at)}</span>
              <span>Pedido #{order.id}</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link to={source === 'tickets' ? '/sessions' : '/products'}>
            <Button>
              {source === 'tickets' ? <Film className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {source === 'tickets' ? 'Voltar as sessoes' : 'Voltar aos produtos'}
            </Button>
          </Link>
          <Link to="/my-tickets">
            <Button variant="glass">
              <Ticket className="h-4 w-4" />
              Ver meus ingressos
            </Button>
          </Link>
          {!isApproved && (
            <Button variant="glass" onClick={() => window.location.reload()} disabled={isLoading}>
              <Clock3 className="h-4 w-4" />
              Verificar novamente
            </Button>
          )}
        </div>
      </section>
    </motion.div>
  );
}
