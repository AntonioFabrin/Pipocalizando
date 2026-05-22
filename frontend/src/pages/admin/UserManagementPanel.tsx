import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Edit3, Mail, Plus, Search, Shield, Trash2, UserRound, Phone } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { type Role } from '../../lib/roles';

type UserFormRole = Exclude<Role, ''>;

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  created_at?: string;
}

type UserFormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserFormRole;
};

const ROLE_META: Record<Role, { label: string; tone: string; icon: string }> = {
  super_admin: { label: 'Super Admin', tone: 'text-cinema-gold bg-cinema-gold/10 border-cinema-gold/30', icon: '👑' },
  manager: { label: 'Manager', tone: 'text-sky-300 bg-sky-500/10 border-sky-500/30', icon: '🧭' },
  seller: { label: 'Seller', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', icon: '🧑‍💼' },
  customer: { label: 'Customer', tone: 'text-white/65 bg-white/5 border-white/10', icon: '👤' },
};

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

function getAllowedRoles(role?: Role | null): UserFormRole[] {
  if (role === 'super_admin') return ['manager', 'seller', 'customer'];
  if (role === 'manager') return ['seller', 'customer'];
  return [];
}

export default function UserManagementPanel({
  users,
  onUsersChanged,
}: {
  users: AdminUser[];
  onUsersChanged: () => Promise<void> | void;
}) {
  const { user } = useAuth();
  const currentUserRole = user?.role;
  const currentUserId = Number(user?.id);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const allowedRoles = useMemo(() => getAllowedRoles(currentUserRole), [currentUserRole]);
  const canCreateUsers = allowedRoles.length > 0;

  const canManageUser = (target: AdminUser) => {
    if (!currentUserRole) return false;
    if (currentUserId === target.id) return true;
    if (currentUserRole === 'manager') return target.role !== 'super_admin';
    return currentUserRole === 'super_admin' ? target.role !== 'super_admin' : false;
  };

  const canDeleteUser = (target: AdminUser) => {
    if (!currentUserRole) return false;
    if (currentUserId === target.id) return false;
    if (target.role === 'super_admin') return false;
    if (currentUserRole === 'manager') return ['seller', 'customer'].includes(target.role);
    return currentUserRole === 'super_admin';
  };

  const canEditRole = () => {
    if (!editingUser || !currentUserRole) return false;
    if (currentUserId === editingUser.id && editingUser.role === 'super_admin') return false;
    return allowedRoles.includes(editingUser.role as UserFormRole) || editingUser.role === 'customer';
  };

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...users]
      .filter((entry) => (roleFilter === 'all' ? true : entry.role === roleFilter))
      .filter((entry) => {
        if (!normalizedSearch) return true;
        return [
          entry.name,
          entry.email,
          entry.phone || '',
          ROLE_META[entry.role]?.label || entry.role,
        ].some((field) => field.toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        const left = new Date(a.created_at || 0).getTime();
        const right = new Date(b.created_at || 0).getTime();
        return right - left;
      });
  }, [roleFilter, search, users]);

  const counts = useMemo(() => {
    const total = users.length;
    const staff = users.filter((entry) => entry.role !== 'customer').length;
    return {
      total,
      staff,
      managers: users.filter((entry) => entry.role === 'manager').length,
      sellers: users.filter((entry) => entry.role === 'seller').length,
      customers: users.filter((entry) => entry.role === 'customer').length,
    };
  }, [users]);

  const openCreate = () => {
    setEditingUser(null);
    setMessage(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: allowedRoles[0] || 'customer',
    });
    setIsModalOpen(true);
  };

  const openEdit = (entry: AdminUser) => {
    setEditingUser(entry);
    setMessage(null);
    setForm({
      name: entry.name || '',
      email: entry.email || '',
      phone: entry.phone || '',
      password: '',
      role: entry.role as UserFormRole,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingUser(null);
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const password = form.password.trim();

    if (!name || !email || !phone) {
      setMessage({ type: 'error', text: 'Nome, email e telefone são obrigatórios.' });
      return;
    }

    if (!editingUser && !password) {
      setMessage({ type: 'error', text: 'Senha é obrigatória ao criar um usuário.' });
      return;
    }

    const canChangeRole = !editingUser || canEditRole();

    if (!editingUser && !allowedRoles.includes(form.role)) {
      setMessage({ type: 'error', text: 'Você não tem permissão para criar esse perfil.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        phone,
      };

      if (password) {
        payload.password = password;
      }

      if (canChangeRole) {
        payload.role = form.role;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
        setMessage({ type: 'success', text: 'Usuário atualizado com sucesso.' });
      } else {
        await api.post('/users', payload);
        setMessage({ type: 'success', text: 'Usuário criado com sucesso.' });
      }

      await onUsersChanged();
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Não foi possível salvar o usuário.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entry: AdminUser) => {
    if (!canDeleteUser(entry)) return;

    const confirmed = window.confirm(`Tem certeza que deseja excluir "${entry.name}"?`);
    if (!confirmed) return;

    setMessage(null);
    try {
      await api.delete(`/users/${entry.id}`);
      setMessage({ type: 'success', text: 'Usuário removido com sucesso.' });
      await onUsersChanged();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Não foi possível remover o usuário.' });
    }
  };

  const roleOptions = editingUser ? getAllowedRoles(currentUserRole) : allowedRoles;
  const roleSelectionLocked = Boolean(editingUser && !canEditRole());
  const currentRoleMeta = editingUser ? ROLE_META[editingUser.role] : null;
  const primaryActionLabel = editingUser ? 'Salvar alterações' : 'Criar usuário';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/35">Total</p>
          <p className="mt-2 font-display text-3xl font-black uppercase italic tracking-tight">{counts.total}</p>
          <p className="mt-2 text-xs text-white/45">Todas as contas visíveis.</p>
        </div>
        <div className="glass-card border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/35">Staff</p>
          <p className="mt-2 font-display text-3xl font-black uppercase italic tracking-tight">{counts.staff}</p>
          <p className="mt-2 text-xs text-white/45">Managers e sellers.</p>
        </div>
        <div className="glass-card border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/35">Managers</p>
          <p className="mt-2 font-display text-3xl font-black uppercase italic tracking-tight">{counts.managers}</p>
          <p className="mt-2 text-xs text-white/45">Gestão e operação.</p>
        </div>
        <div className="glass-card border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/35">Customers</p>
          <p className="mt-2 font-display text-3xl font-black uppercase italic tracking-tight">{counts.customers}</p>
          <p className="mt-2 text-xs text-white/45">Clientes cadastrados.</p>
        </div>
      </div>

      <div className="glass-card border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cinema-red">User management</p>
            <h3 className="font-display text-3xl font-black uppercase italic tracking-tighter">
              {currentUserRole === 'super_admin' ? 'Manage every account' : 'Manage seller and customer accounts'}
            </h3>
            <p className="max-w-2xl text-sm text-white/50">
              {currentUserRole === 'super_admin'
                ? 'Crie, edite e remova usuários com todas as permissões do backend. Contas super_admin ficam protegidas.'
                : 'Gerentes podem criar e manter sellers e customers. Contas super_admin ficam somente para leitura.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar usuário..."
                className="w-full rounded-2xl border border-white/10 bg-black/25 py-3 pl-12 pr-4 text-sm text-white outline-none transition-colors focus:border-cinema-red/50 sm:w-[280px]"
              />
            </div>
            {canCreateUsers && (
              <Button onClick={openCreate} className="rounded-2xl">
                <Plus className="h-4 w-4" />
                Novo usuário
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(['all', 'super_admin', 'manager', 'seller', 'customer'] as const).map((filter) => {
            const active = roleFilter === filter;
            const label = filter === 'all' ? 'Todos' : ROLE_META[filter].label;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setRoleFilter(filter)}
                className={[
                  'rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] transition-colors',
                  active
                    ? 'border-cinema-red/30 bg-cinema-red/10 text-cinema-red'
                    : 'border-white/10 bg-white/5 text-white/45 hover:border-white/20 hover:text-white',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>

        {currentUserRole === 'manager' && (
          <div className="mt-5 rounded-2xl border border-cinema-gold/20 bg-cinema-gold/10 px-4 py-3 text-sm text-cinema-gold">
            Contas super_admin aparecem como leitura somente. Ações de criação e exclusão seguem as regras do backend.
          </div>
        )}

        {message && (
          <div
            className={[
              'mt-5 rounded-2xl border px-4 py-3 text-sm',
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-cinema-red/30 bg-cinema-red/10 text-cinema-red',
            ].join(' ')}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((entry) => {
            const meta = ROLE_META[entry.role];
            const canEdit = canManageUser(entry);
            const canDelete = canDeleteUser(entry);
            const isSelf = Number(entry.id) === currentUserId;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-xl">
                      <UserRound className="h-6 w-6 text-cinema-red" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-display text-2xl font-black uppercase italic tracking-tight">{entry.name}</h4>
                        {isSelf && (
                          <span className="rounded-full border border-cinema-gold/30 bg-cinema-gold/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-cinema-gold">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-white/50">
                        <span className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-white/30" />
                          {entry.email}
                        </span>
                        <span className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-white/30" />
                          {entry.phone || 'Sem telefone'}
                        </span>
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-white/30" />
                          {formatDateTime(entry.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <span className={['inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]', meta.tone].join(' ')}>
                      <span>{meta.icon}</span>
                      {meta.label}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="glass" size="sm" onClick={() => openEdit(entry)}>
                        <Edit3 className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canDelete}
                        onClick={() => handleDelete(entry)}
                        className={!canDelete ? 'opacity-50' : ''}
                        title={
                          !canDelete
                            ? 'Esta conta não pode ser removida por este perfil.'
                            : 'Remover usuário'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-white/10 bg-black/20 p-10 text-center text-sm text-white/45">
            Nenhum usuário encontrado para os filtros atuais.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-10 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0c0c0c] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cinema-red">
                  {editingUser ? 'Editar usuário' : 'Novo usuário'}
                </p>
                <h3 className="font-display text-3xl font-black uppercase italic tracking-tighter">
                  {editingUser ? editingUser.name : 'Criar conta'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.25em] text-white/50 transition-colors hover:text-white"
              >
                Fechar
              </button>
            </div>

            {message && (
              <div
                className={[
                  'mt-5 rounded-2xl border px-4 py-3 text-sm',
                  message.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-cinema-red/30 bg-cinema-red/10 text-cinema-red',
                ].join(' ')}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-white/45">Nome</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors focus:border-cinema-red/50"
                    placeholder="Nome completo"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-white/45">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors focus:border-cinema-red/50"
                    placeholder="usuario@exemplo.com"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-white/45">Telefone</span>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors focus:border-cinema-red/50"
                    placeholder="(00) 00000-0000"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
                    {editingUser ? 'Nova senha' : 'Senha'}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors focus:border-cinema-red/50"
                    placeholder={editingUser ? 'Deixe em branco para manter a atual' : 'Senha inicial'}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-white/45">Perfil</span>
                  {roleSelectionLocked ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      {currentRoleMeta?.icon} {currentRoleMeta?.label}
                      <p className="mt-1 text-xs text-white/40">
                        Este perfil não pode ser alterado por este usuário.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={form.role}
                      onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserFormRole }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors focus:border-cinema-red/50"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_META[role].label}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-white/45">Permissões</span>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/55">
                    <p className="font-black uppercase tracking-[0.25em] text-white/45">
                      {currentUserRole === 'super_admin' ? 'Tudo liberado no backend' : 'Permissões limitadas'}
                    </p>
                    <p className="mt-2">
                      {editingUser
                        ? 'Atualize nome, email, telefone e, quando permitido, o perfil do usuário.'
                        : 'Criação respeita as regras do backend para o seu perfil atual.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="glass" onClick={closeModal} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : primaryActionLabel}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
