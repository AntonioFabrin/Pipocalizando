import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Film,
  LayoutDashboard,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Ticket,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { cn } from '@/src/lib/utils';

type AdminTab = 'overview' | 'orders' | 'products' | 'movies' | 'team';

interface AdminOrder {
  id: number;
  customer_name?: string | null;
  ticket_code?: string | null;
  ticket_issued_at?: string | null;
  total: number;
  status: string;
  payment_status?: string | null;
  payment_method?: string | null;
  created_at?: string;
}

interface AdminProduct {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  category_name?: string | null;
  is_active?: number;
}

interface AdminMovie {
  id: number;
  title: string;
  genre?: string | null;
  status?: string | null;
  price?: number | null;
  session_date?: string | null;
  session_time?: string | null;
  room_name?: string | null;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

const STAFF_ROLES = ['super_admin', 'manager'];
const TEAM_ROLES = ['manager', 'seller'];

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Pending', tone: 'text-cinema-gold bg-cinema-gold/10 border-cinema-gold/30' },
  confirmed: { label: 'Confirmed', tone: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
  preparing: { label: 'Preparing', tone: 'text-orange-300 bg-orange-500/10 border-orange-500/30' },
  ready: { label: 'Ready', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  delivered: { label: 'Delivered', tone: 'text-white/75 bg-white/5 border-white/10' },
  cancelled: { label: 'Cancelled', tone: 'text-red-300 bg-red-500/10 border-red-500/30' },
  approved: { label: 'Approved', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  rejected: { label: 'Rejected', tone: 'text-red-300 bg-red-500/10 border-red-500/30' },
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  seller: 'Seller',
  customer: 'Customer',
};

const formatCurrency = (value?: number | string | null) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const formatDateTime = (value?: string) => {
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

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="glass-card border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/35">{label}</p>
          <p className="mt-2 font-display text-3xl font-black uppercase italic tracking-tight">{value}</p>
          {hint && <p className="mt-2 text-xs text-white/45">{hint}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cinema-red/20 bg-cinema-red/10 text-cinema-red">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cinema-red">{eyebrow}</p>
      <h2 className="font-display text-3xl md:text-4xl font-black uppercase italic tracking-tighter">{title}</h2>
      {description && <p className="max-w-2xl text-sm text-white/50">{description}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = !!user && STAFF_ROLES.includes(user.role);

  useEffect(() => {
    if (!canAccess) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const [ordersData, productsData, moviesData, usersData] = await Promise.all([
          api.get<AdminOrder[]>('/orders'),
          api.get<AdminProduct[]>('/products'),
          api.get<AdminMovie[]>('/movies'),
          api.get<AdminUser[]>('/users'),
        ]);

        if (!mounted) return;

        setOrders(ordersData);
        setProducts(productsData);
        setMovies(moviesData);
        setUsers(usersData);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Erro ao carregar o painel administrativo.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [canAccess]);

  const summary = useMemo(() => {
    const approvedTotal = orders
      .filter((order) => order.payment_status === 'approved')
      .reduce((acc, order) => acc + Number(order.total || 0), 0);
    const teamMembers = users.filter((member) => TEAM_ROLES.includes(member.role));

    return {
      orders: orders.length,
      pendingOrders: orders.filter((order) => order.status === 'pending').length,
      approvedOrders: orders.filter((order) => order.payment_status === 'approved').length,
      products: products.length,
      movies: movies.length,
      team: teamMembers.length,
      revenue: approvedTotal,
      lowStock: products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 10).length,
    };
  }, [orders, products, users, movies]);

  const tabs: Array<{ key: AdminTab; label: string; icon: any }> = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: Ticket },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'movies', label: 'Movies', icon: Film },
    { key: 'team', label: 'Team', icon: Users },
  ];

  const recentOrders = [...orders].sort((a, b) => {
    const left = new Date(a.created_at || 0).getTime();
    const right = new Date(b.created_at || 0).getTime();
    return right - left;
  });

  const recentMovies = [...movies].slice(0, 6);
  const recentProducts = [...products].slice(0, 6);
  const recentUsers = [...users].filter((member) => TEAM_ROLES.includes(member.role)).slice(0, 6);

  if (!canAccess) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center px-6 pt-24">
        <div className="glass-card w-full max-w-lg space-y-6 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cinema-red/15 text-cinema-red">
            <ShieldAccessIcon />
          </div>
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-black uppercase italic tracking-tighter">Access Denied</h1>
            <p className="text-sm text-white/50">
              This area is restricted to super_admin and manager accounts.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate('/')} variant="primary">
              Back to home
            </Button>
            <Button onClick={logout} variant="glass">
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] pt-24">
        <Spinner message="Loading admin panel..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-32">
        <ErrorMessage message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl px-6 pb-24 pt-32 lg:px-12"
    >
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(229,9,20,0.18),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))] p-8 md:p-10">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cinema-red/20 blur-3xl" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cinema-red text-white shadow-[0_0_30px_rgba(229,9,20,0.35)]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cinema-red">Admin Center</p>
                <p className="text-sm text-white/45">
                  {user?.name} • {ROLE_LABELS[user?.role || ''] || user?.role}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-5xl font-black uppercase italic tracking-tighter md:text-7xl">
                Manage the show from one place
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
                A centralized operational view for orders, products, movies and team members.
                This is the base screen we can now expand with the exact workflows you want next.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/admin/products/new')}>
                <Plus className="h-4 w-4" />
                New product
              </Button>
              <Button size="lg" variant="glass" onClick={() => navigate('/admin/movies/new')}>
                <Film className="h-4 w-4" />
                New movie
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setActiveTab('orders')}>
                <Ticket className="h-4 w-4" />
                Review orders
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard icon={Ticket} label="Orders" value={summary.orders} hint={`${summary.pendingOrders} pending`} />
            <StatCard icon={Package} label="Products" value={summary.products} hint={`${summary.lowStock} low stock`} />
            <StatCard icon={Film} label="Movies" value={summary.movies} hint="Catalog overview" />
            <StatCard icon={BadgeCheck} label="Revenue" value={formatCurrency(summary.revenue)} hint={`${summary.approvedOrders} approved`} />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Team" value={summary.team} hint="Accessible user list" />
        <StatCard icon={Activity} label="Live orders" value={summary.pendingOrders} hint="Waiting to move forward" />
        <StatCard icon={ShoppingBag} label="Low stock" value={summary.lowStock} hint="Needs attention" />
        <StatCard icon={RefreshCw} label="Quick refresh" value="On demand" hint="Reload the panel when needed" />
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            eyebrow="Operations"
            title="Control room"
            description="Switch between the main operational areas without leaving the dashboard."
          />

          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.25em] transition-colors',
                    active
                      ? 'bg-cinema-red text-white shadow-[0_0_20px_rgba(229,9,20,0.25)]'
                      : 'text-white/45 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="glass-card p-6">
                <SectionTitle
                  eyebrow="Recent orders"
                  title="What is happening now"
                  description="The latest orders arrive here with ticket, payment and status context."
                />

                <div className="mt-6 space-y-4">
                  {recentOrders.slice(0, 5).map((order) => {
                    const status = STATUS_LABELS[order.status] || { label: order.status, tone: 'text-white/60 bg-white/5 border-white/10' };
                    const payment = STATUS_LABELS[order.payment_status || ''] || { label: order.payment_status || 'Unknown', tone: 'text-white/60 bg-white/5 border-white/10' };

                    return (
                      <div key={order.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-display text-xl font-black uppercase italic tracking-tight">Order #{order.id}</p>
                            <p className="mt-1 text-sm text-white/50">
                              {order.customer_name || 'Anonymous customer'} • {formatDateTime(order.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]', status.tone)}>
                              {status.label}
                            </span>
                            <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]', payment.tone)}>
                              {payment.label}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/50">
                          <span>
                            Ticket: {order.ticket_code || '-'}
                            {order.ticket_issued_at ? ` • ${formatDateTime(order.ticket_issued_at)}` : ''}
                          </span>
                          <span>{order.payment_method || '-'}</span>
                          <span className="font-display text-lg font-black text-cinema-gold">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {recentOrders.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-white/45">
                      No orders found yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-6">
                  <SectionTitle eyebrow="Quick actions" title="Fast tracks" />
                  <div className="mt-6 grid gap-3">
                    <Link to="/admin/products/new">
                      <div className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-cinema-red/40 hover:bg-cinema-red/5">
                        <div>
                          <p className="font-display text-xl font-black uppercase italic tracking-tight">Create product</p>
                          <p className="mt-1 text-xs text-white/45">Open the product form with the current UI style.</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-cinema-red transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                    <Link to="/admin/movies/new">
                      <div className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-cinema-red/40 hover:bg-cinema-red/5">
                        <div>
                          <p className="font-display text-xl font-black uppercase italic tracking-tight">Create movie</p>
                          <p className="mt-1 text-xs text-white/45">Add a new release, session and poster.</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-cinema-red transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                    <button
                      onClick={() => setActiveTab('team')}
                      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition-colors hover:border-cinema-red/40 hover:bg-cinema-red/5"
                    >
                      <div>
                        <p className="font-display text-xl font-black uppercase italic tracking-tight">Review team</p>
                        <p className="mt-1 text-xs text-white/45">See only managers and sellers.</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-cinema-red transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <SectionTitle eyebrow="Health" title="System snapshot" />
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <span className="text-sm text-white/55">Catalog status</span>
                      <span className="font-black uppercase tracking-[0.25em] text-emerald-300">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <span className="text-sm text-white/55">Admin route</span>
                      <span className="font-black uppercase tracking-[0.25em] text-cinema-gold">Active</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <span className="text-sm text-white/55">Role access</span>
                      <span className="font-black uppercase tracking-[0.25em] text-sky-300">staff only</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="grid gap-4">
              {recentOrders.map((order) => {
                const status = STATUS_LABELS[order.status] || { label: order.status, tone: 'text-white/60 bg-white/5 border-white/10' };
                return (
                  <div key={order.id} className="glass-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-display text-2xl font-black uppercase italic tracking-tight">Order #{order.id}</p>
                      <p className="mt-1 text-sm text-white/50">
                        {order.customer_name || 'Anonymous'} • {formatDateTime(order.created_at)}
                      </p>
                      <p className="mt-2 text-xs text-white/40">
                        Ticket {order.ticket_code || '-'}{order.ticket_issued_at ? ` • ${formatDateTime(order.ticket_issued_at)}` : ''} • {order.payment_method || '-'}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]', status.tone)}>
                        {status.label}
                      </span>
                      <p className="font-display text-3xl font-black text-cinema-gold">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recentProducts.map((product) => (
                <div key={product.id} className="glass-card overflow-hidden">
                  <div className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-2xl font-black uppercase italic tracking-tight">{product.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-cinema-red">{product.category_name || 'Other'}</p>
                      </div>
                      <span
                        className={cn(
                          'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]',
                          Number(product.stock || 0) <= 0 && 'border-white/10 bg-white/5 text-white/35',
                          Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 10 && 'border-cinema-gold/30 bg-cinema-gold/10 text-cinema-gold',
                          Number(product.stock || 0) > 10 && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        )}
                      >
                        {product.stock || 0} stock
                      </span>
                    </div>
                    <p className="mt-4 min-h-[48px] text-sm text-white/50">
                      {product.description || 'No description provided.'}
                    </p>
                    <div className="mt-6 flex items-center justify-between">
                      <p className="font-display text-3xl font-black text-cinema-gold">{formatCurrency(product.price)}</p>
                      <div className="flex gap-2">
                        <Link to={`/admin/products/edit/${product.id}`}>
                          <Button variant="glass" size="sm">Edit</Button>
                        </Link>
                        <Button variant="secondary" size="sm" onClick={() => navigate('/admin/products/new')}>
                          Duplicate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'movies' && (
            <div className="grid gap-4 lg:grid-cols-2">
              {recentMovies.map((movie) => (
                <div key={movie.id} className="glass-card flex gap-4 overflow-hidden p-4">
                  <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Film className="h-8 w-8 text-cinema-red" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-2xl font-black uppercase italic tracking-tight line-clamp-1">{movie.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/45">{movie.genre || 'No genre'}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/55">
                        {movie.status || 'now_playing'}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/50">
                      <span>{movie.room_name || '-'}</span>
                      <span>{movie.session_date || '-'}</span>
                      <span>{movie.session_time || '-'}</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <p className="font-display text-2xl font-black text-cinema-gold">
                        {movie.price ? formatCurrency(movie.price) : 'Free'}
                      </p>
                      <div className="flex gap-2">
                        <Link to={`/admin/movies/edit/${movie.id}`}>
                          <Button variant="glass" size="sm">Edit</Button>
                        </Link>
                        <Button variant="secondary" size="sm" onClick={() => navigate('/admin/movies/new')}>
                          New
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              <SectionTitle
                eyebrow="Team"
                title="Seller and manager accounts"
                description="Only operational team members are shown here. Customer accounts stay out of this view."
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recentUsers.map((teamMember) => (
                <div key={teamMember.id} className="glass-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-2xl font-black uppercase italic tracking-tight">{teamMember.name}</p>
                      <p className="mt-1 text-sm text-white/50">{teamMember.email}</p>
                    </div>
                    <span className="rounded-full border border-cinema-red/30 bg-cinema-red/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-cinema-red">
                      {ROLE_LABELS[teamMember.role] || teamMember.role}
                    </span>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.25em] text-white/35">
                    Joined {formatDateTime(teamMember.created_at)}
                  </p>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

function ShieldAccessIcon() {
  return <Users className="h-8 w-8" />;
}
