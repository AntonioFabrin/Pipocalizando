import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CreditCard, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { cn } from '@/src/lib/utils';

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'debit_card', label: 'Cartão de débito' },
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'pix', label: 'Pix' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderId: number; total: number; message: string } | null>(null);

  const orderPayload = useMemo(
    () => ({
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      payment_method: paymentMethod,
      notes: notes.trim() || undefined,
    }),
    [items, notes, paymentMethod]
  );

  const handleCheckout = async () => {
    if (!items.length || isSubmitting) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await api.post<{
        order_id: number;
        total: number;
        checkout_url?: string | null;
        payment_status?: string | null;
      }>('/orders', orderPayload);

      setNotes('');
      setPaymentMethod('pix');

      if (response.checkout_url) {
        window.localStorage.setItem('pending_order_id', String(response.order_id));
        window.location.href = response.checkout_url;
        return;
      }

      setSuccess({
        orderId: response.order_id,
        total: Number(response.total || 0),
        message: 'Pedido criado. Aguarde a confirmação do pagamento.',
      });
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel finalizar a compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCheckout = items.length > 0 && !isSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24 space-y-10"
    >
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(229,9,20,0.16),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))] p-8 md:p-10">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-0.5 bg-cinema-red" />
              <span className="text-cinema-red font-bold uppercase tracking-[0.3em] text-xs">
                Carrinho
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9]">
              Finalizar <span className="text-cinema-red text-glow">compra</span>
            </h1>
            <p className="max-w-2xl text-white/60 leading-relaxed">
              Revise seus produtos, ajuste quantidades e conclua o pedido em um passo só.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">Itens</p>
              <p className="mt-2 font-display text-3xl font-black">{totalItems}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">Total</p>
              <p className="mt-2 font-display text-3xl font-black text-cinema-gold">{formatCurrency(totalPrice)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">Status</p>
              <p className="mt-2 font-display text-3xl font-black text-emerald-300">Pronto</p>
            </div>
          </div>
        </div>
      </section>

      {success && (
        <div className="rounded-[1.75rem] border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-100">
          <p className="text-sm font-black uppercase tracking-[0.25em]">Pedido confirmado</p>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
            <span>Pedido #{success.orderId}</span>
            <span>{success.message}</span>
            <span>{formatCurrency(success.total)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-[1.75rem] border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-100">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="glass-card rounded-[2rem] px-6 py-16 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-white/20" />
          <p className="mt-5 font-display text-3xl font-black uppercase italic">Carrinho vazio</p>
          <p className="mt-2 text-sm text-white/45">Adicione produtos na bomboniere para montar seu pedido.</p>
          <Link to="/products" className="mt-6 inline-flex">
            <Button className="rounded-xl">
              Ver produtos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="glass-card flex flex-col gap-4 rounded-[1.75rem] p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1549421263-549463996f6e?q=80&w=1600&auto=format&fit=crop'}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cinema-red">
                      {item.category_name || 'Outros'}
                    </p>
                    <h2 className="font-display text-2xl font-black uppercase italic tracking-tight">{item.name}</h2>
                    <p className="text-sm text-white/50">{formatCurrency(item.price)} por unidade</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <div className="flex items-center rounded-2xl border border-white/10 bg-black/25">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-none rounded-l-2xl px-3 py-2"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-14 px-4 text-center text-sm font-black">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-none rounded-r-2xl px-3 py-2"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.stock > 0 && item.quantity >= item.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Subtotal</p>
                    <p className="font-display text-2xl font-black text-cinema-gold">
                      {formatCurrency(item.quantity * Number(item.price || 0))}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    className="rounded-xl border border-white/10 px-3"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remover ${item.name}`}
                    title="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </section>

          <aside className="glass-card space-y-6 rounded-[2rem] p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">Resumo</p>
              <h2 className="mt-2 font-display text-3xl font-black uppercase italic tracking-tight">
                Seu pedido
              </h2>
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-5">
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                Forma de pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-cinema-red/50"
              >
                {PAYMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-cinema-black">
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Ex.: sem manteiga, retirar gelo, mesa 12..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-cinema-red/50"
              />
            </div>

            <div className="space-y-3 text-sm text-white/60">
              <div className="flex items-center justify-between">
                <span>Itens</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pagamento</span>
                <span>{PAYMENT_OPTIONS.find((option) => option.value === paymentMethod)?.label}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base">
                <span className="font-black uppercase tracking-[0.2em] text-white/45">Total</span>
                <span className="font-display text-3xl font-black text-cinema-gold">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="rounded-2xl border border-cinema-red/30 bg-cinema-red/10 p-4 text-sm text-cinema-red">
                Faça login para concluir a compra.
              </div>
            )}

            <Button
              type="button"
              size="lg"
              className={cn('w-full rounded-2xl', !canCheckout && 'cursor-not-allowed')}
              onClick={handleCheckout}
              disabled={!canCheckout}
            >
              {isSubmitting ? (
                'Finalizando...'
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  {isAuthenticated ? 'Finalizar compra' : 'Entrar para comprar'}
                </>
              )}
            </Button>
          </aside>
        </div>
      )}
    </motion.div>
  );
}
