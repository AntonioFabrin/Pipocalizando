import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarClock,
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
import { hasRole, ADMIN_ROLES, type Role } from '../../lib/roles';
import UserManagementPanel, { type AdminUser as ManagedAdminUser } from './UserManagementPanel';

type AdminTab = 'overview' | 'orders' | 'products' | 'movies' | 'team' | 'sales';
type SalesPeriod = 7 | 30 | 90;

interface AdminOrder {
  id: number;
  customer_name?: string | null;
  ticket_code?: string | null;
  ticket_issued_at?: string | null;
  payment_id?: number | null;
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
  role: Role;
  created_at?: string;
}

interface SalesItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface SalesRecord {
  order_id: number;
  total: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  created_at: string;
  paid_at?: string | null;
  ticket_code?: string | null;
  ticket_issued_at?: string | null;
  items: SalesItem[];
  items_summary: string;
}

interface DailySale {
  date: string;
  sales_count: number;
  revenue: number;
}

interface TopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

interface SalesReportResponse {
  period_days: number;
  summary: {
    total_sales: number;
    total_revenue: number;
    total_items_sold: number;
    unique_customers: number;
    average_ticket: number;
  };
  sales: SalesRecord[];
  daily_sales: DailySale[];
  top_products: TopProduct[];
}

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

const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  seller: 'Seller',
  customer: 'Customer',
};

const PERIOD_OPTIONS: Array<{ label: string; value: SalesPeriod }> = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

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

function formatDayLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

function MetricCard({
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

function SalesChart({ data }: { data: DailySale[] }) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);
  const maxCount = Math.max(...data.map((item) => item.sales_count), 1);
  const chartHeight = 280;
  const chartWidth = 1000;
  const paddingX = 36;
  const paddingTop = 24;
  const paddingBottom = 48;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = (chartWidth - paddingX * 2) / Math.max(data.length, 1);
  const barWidth = Math.max(stepX - 10, 10);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cinema-red">Sales graph</p>
          <h3 className="mt-2 font-display text-2xl font-black uppercase italic tracking-tighter">Revenue by day</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/45">
          <span className="rounded-full border border-cinema-red/30 bg-cinema-red/10 px-3 py-1 text-cinema-red">
            Revenue bars
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Daily sales count</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-[280px] min-w-[720px] w-full"
          role="img"
          aria-label="Sales chart"
        >
          <defs>
            <linearGradient id="salesBarGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e50914" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#e50914" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <line
            x1={paddingX}
            y1={chartHeight - paddingBottom}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingBottom}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="2"
          />

          {data.map((day, index) => {
            const barHeight = usableHeight * (day.revenue / maxRevenue);
            const countHeight = usableHeight * (day.sales_count / maxCount);
            const x = paddingX + index * stepX + 5;
            const y = chartHeight - paddingBottom - barHeight;
            const countY = chartHeight - paddingBottom - countHeight;
            const showLabel = index % Math.max(1, Math.floor(data.length / 8)) === 0 || index === data.length - 1;

            return (
              <g key={day.date}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="14" fill="url(#salesBarGradient)" />
                <rect
                  x={x + barWidth * 0.32}
                  y={countY}
                  width={Math.max(barWidth * 0.36, 4)}
                  height={Math.max(countHeight, 2)}
                  rx="999"
                  fill="rgba(255,255,255,0.45)"
                />
                <circle cx={x + barWidth / 2} cy={y - 8} r="3" fill="#ffffff" opacity="0.85" />
                <text
                  x={x + barWidth / 2}
                  y={y - 18}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.75)"
                  fontSize="12"
                  fontWeight="700"
                >
                  {formatCurrency(day.revenue)}
                </text>
                {showLabel && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 18}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="12"
                    fontWeight="700"
                  >
                    {formatDayLabel(day.date)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function AdminDashboard({ initialTab = 'overview' }: { initialTab?: AdminTab } = {}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReportResponse | null>(null);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalesLoading, setIsSalesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [paymentActionId, setPaymentActionId] = useState<number | null>(null);

  const canAccess = hasRole(user?.role, ADMIN_ROLES);
  const isSuperAdmin = user?.role === 'super_admin';
  const canAccessTeam = hasRole(user?.role, ADMIN_ROLES);

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
          canAccessTeam ? api.get<AdminUser[]>('/users') : Promise.resolve([] as AdminUser[]),
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
  }, [canAccess, canAccessTeam]);

  useEffect(() => {
    if (!canAccess || !isSuperAdmin) {
      setIsSalesLoading(false);
      return;
    }

    let mounted = true;

    async function fetchSalesReport() {
      try {
        setIsSalesLoading(true);
        setSalesError(null);
        const data = await api.get<SalesReportResponse>(`/reports/sales?days=${salesPeriod}`);
        if (!mounted) return;
        setSalesReport(data);
      } catch (err: any) {
        if (!mounted) return;
        setSalesError(err?.message || 'Erro ao carregar o relatorio de vendas.');
      } finally {
        if (mounted) setIsSalesLoading(false);
      }
    }

    fetchSalesReport();

    return () => {
      mounted = false;
    };
  }, [canAccess, isSuperAdmin, salesPeriod]);

  useEffect(() => {
    if (activeTab === 'sales' && !isSuperAdmin) {
      setActiveTab('overview');
    }
  }, [activeTab, isSuperAdmin]);

  useEffect(() => {
    if (activeTab === 'team' && !canAccessTeam) {
      setActiveTab('overview');
    }
  }, [activeTab, canAccessTeam]);

  const summary = useMemo(() => {
    const approvedTotal = orders
      .filter((order) => order.payment_status === 'approved')
      .reduce((acc, order) => acc + Number(order.total || 0), 0);
    return {
      orders: orders.length,
      pendingOrders: orders.filter((order) => order.status === 'pending').length,
      approvedOrders: orders.filter((order) => order.payment_status === 'approved').length,
      products: products.length,
      movies: movies.length,
      team: canAccessTeam ? users.length : 0,
      revenue: approvedTotal,
      lowStock: products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 10).length,
    };
  }, [orders, products, users, movies, canAccessTeam]);

  const tabs: Array<{ key: AdminTab; label: string; icon: any }> = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: Ticket },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'movies', label: 'Movies', icon: Film },
    ...(canAccessTeam ? [{ key: 'team' as const, label: 'Team', icon: Users }] : []),
    ...(isSuperAdmin ? [{ key: 'sales' as const, label: 'Sales', icon: BarChart3 }] : []),
  ];

  const recentOrders = [...orders].sort((a, b) => {
    const left = new Date(a.created_at || 0).getTime();
    const right = new Date(b.created_at || 0).getTime();
    return right - left;
  });

  const recentMovies = [...movies].slice(0, 6);
  const recentProducts = [...products].slice(0, 6);
  const salesSummary = salesReport?.summary;
  const salesRows = salesReport?.sales || [];
  const dailySales = salesReport?.daily_sales || [];
  const topProducts = salesReport?.top_products || [];

  const handlePaymentAction = async (paymentId: number, action: 'approve' | 'reject') => {
    try {
      setPaymentActionId(paymentId);
      await api.patch(`/payments/${paymentId}/${action}`);
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel atualizar o pagamento.');
    } finally {
      setPaymentActionId(null);
    }
  };

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
                A centralized operational view for orders, products, movies and user access.
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
            {canAccessTeam && <StatCard icon={Users} label="Users" value={summary.team} hint="Accessible accounts" />}
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
                    {user?.role === 'super_admin' && (
                      <Link to="/admin/sales">
                        <div className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-cinema-red/40 hover:bg-cinema-red/5">
                          <div>
                            <p className="font-display text-xl font-black uppercase italic tracking-tight">Sales report</p>
                            <p className="mt-1 text-xs text-white/45">See purchases, buyers and sales graph.</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-cinema-red transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    )}
                    {canAccessTeam && (
                      <button
                        onClick={() => setActiveTab('team')}
                        className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition-colors hover:border-cinema-red/40 hover:bg-cinema-red/5"
                      >
                        <div>
                          <p className="font-display text-xl font-black uppercase italic tracking-tight">Review users</p>
                          <p className="mt-1 text-xs text-white/45">
                            Create, edit and remove user accounts according to your role.
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-cinema-red transition-transform group-hover:translate-x-1" />
                      </button>
                    )}
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
            <div className="space-y-4">
              <SectionTitle
                eyebrow="Orders"
                title="Payment control"
                description="Aprovar confirma o pedido e dispara a baixa de estoque; rejeitar cancela o pagamento pendente e libera o fluxo."
              />
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
                      {order.payment_status === 'pending' && order.payment_id ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handlePaymentAction(order.payment_id!, 'approve')}
                            disabled={paymentActionId === order.payment_id}
                          >
                            Aprovar pagamento
                          </Button>
                          <Button
                            size="sm"
                            variant="glass"
                            onClick={() => handlePaymentAction(order.payment_id!, 'reject')}
                            disabled={paymentActionId === order.payment_id}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              </div>
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

          {activeTab === 'team' && canAccessTeam && (
            <UserManagementPanel
              users={users as ManagedAdminUser[]}
              onUsersChanged={async () => {
                const refreshedUsers = await api.get<AdminUser[]>('/users');
                setUsers(refreshedUsers);
              }}
            />
          )}

          {activeTab === 'sales' && isSuperAdmin && (
            <div className="space-y-6">
              {isSalesLoading ? (
                <div className="rounded-[2rem] border border-white/10 bg-black/20 p-10">
                  <Spinner message="Loading sales data..." />
                </div>
              ) : salesError ? (
                <ErrorMessage message={salesError} onRetry={() => window.location.reload()} />
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <SectionTitle
                      eyebrow="Sales"
                      title="Revenue and purchases"
                      description="One view for what was sold, who bought it, when it happened and how the revenue behaved."
                    />
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                      {PERIOD_OPTIONS.map((option) => {
                        const active = salesPeriod === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setSalesPeriod(option.value)}
                            className={cn(
                              'rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.25em] transition-colors',
                              active
                                ? 'bg-cinema-red text-white shadow-[0_0_20px_rgba(229,9,20,0.25)]'
                                : 'text-white/45 hover:bg-white/5 hover:text-white'
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard icon={BarChart3} label="Sales" value={salesSummary?.total_sales ?? 0} hint={`Period: ${salesReport?.period_days || salesPeriod} days`} />
                    <MetricCard icon={ShoppingBag} label="Revenue" value={formatCurrency(salesSummary?.total_revenue)} hint="Approved payments only" />
                    <MetricCard icon={Package} label="Items sold" value={salesSummary?.total_items_sold ?? 0} hint="All product lines" />
                    <MetricCard icon={Users} label="Customers" value={salesSummary?.unique_customers ?? 0} hint={`Ticket avg: ${formatCurrency(salesSummary?.average_ticket)}`} />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    <SalesChart data={dailySales} />

                    <div className="space-y-6">
                      <div className="glass-card p-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cinema-red">Top products</p>
                            <h3 className="mt-2 font-display text-2xl font-black uppercase italic tracking-tighter">Best sellers</h3>
                          </div>
                          <Package className="h-5 w-5 text-cinema-red" />
                        </div>

                        <div className="mt-6 space-y-3">
                          {topProducts.length > 0 ? (
                            topProducts.map((product, index) => (
                              <div key={product.product_id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-display text-xl font-black uppercase italic tracking-tight">
                                      #{index + 1} {product.product_name}
                                    </p>
                                    <p className="mt-1 text-xs text-white/45">{product.quantity_sold} unidades vendidas</p>
                                  </div>
                                  <p className="font-display text-lg font-black text-cinema-gold">{formatCurrency(product.revenue)}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-white/45">
                              No product sales yet.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="glass-card p-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cinema-red">Sales window</p>
                            <h3 className="mt-2 font-display text-2xl font-black uppercase italic tracking-tighter">Latest movement</h3>
                          </div>
                          <CalendarClock className="h-5 w-5 text-cinema-red" />
                        </div>
                        <div className="mt-6 space-y-3">
                          {dailySales.slice(-5).map((day) => (
                            <div key={day.date} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                              <div>
                                <p className="text-sm font-black uppercase tracking-[0.25em] text-white/70">{formatDayLabel(day.date)}</p>
                                <p className="mt-1 text-xs text-white/40">{day.sales_count} sales</p>
                              </div>
                              <p className="font-display text-xl font-black text-cinema-gold">{formatCurrency(day.revenue)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cinema-red">Sales log</p>
                        <h2 className="mt-2 font-display text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                          What was sold
                        </h2>
                      </div>
                      <p className="hidden text-sm text-white/45 md:block">
                        Each card shows the buyer, the items included and the exact sale timestamp.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      {salesRows.length > 0 ? (
                        salesRows.map((sale) => (
                          <article key={sale.order_id} className="glass-card overflow-hidden p-5">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="font-display text-2xl font-black uppercase italic tracking-tight">
                                    Sale #{sale.order_id}
                                  </p>
                                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
                                    {sale.payment_status}
                                  </span>
                                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/55">
                                    {sale.payment_method}
                                  </span>
                                </div>

                                <p className="text-sm text-white/50">
                                  {sale.customer_name} • {sale.customer_email}
                                </p>
                                <p className="text-xs text-white/40">
                                  Purchased at {formatDateTime(sale.paid_at || sale.created_at)}
                                </p>
                                {sale.ticket_code && (
                                  <p className="text-xs text-white/40">
                                    Ticket: {sale.ticket_code}
                                    {sale.ticket_issued_at ? ` • issued ${formatDateTime(sale.ticket_issued_at)}` : ''}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-start gap-2 xl:items-end">
                                <p className="font-display text-3xl font-black text-cinema-gold">{formatCurrency(sale.total)}</p>
                                <p className="text-xs uppercase tracking-[0.25em] text-white/40">{sale.order_status}</p>
                              </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">Items sold</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {sale.items.length > 0 ? (
                                  sale.items.map((item) => (
                                    <span
                                      key={`${sale.order_id}-${item.product_id}`}
                                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70"
                                    >
                                      {item.product_name} x{item.quantity}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-white/45">No item details found.</span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
                              <span>{sale.items_summary}</span>
                              <span>{formatDateTime(sale.created_at)}</span>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-10 text-center text-sm text-white/45">
                          No approved sales found for this period.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
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
