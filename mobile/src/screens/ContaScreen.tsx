import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Platform, Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getOrders, getMovies } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

type TabType = 'perfil' | 'pipocas' | 'sessoes';

const STATUS_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  pending:   { label: 'Aguardando', color: COLORS.warning,       emoji: '⏳' },
  confirmed: { label: 'Confirmado', color: '#64B5F6',            emoji: '✅' },
  preparing: { label: 'Preparando', color: '#FF9800',            emoji: '🍿' },
  ready:     { label: 'Pronto!',    color: COLORS.success,       emoji: '🎉' },
  delivered: { label: 'Entregue',   color: COLORS.textSecondary, emoji: '📦' },
  cancelled: { label: 'Cancelado',  color: COLORS.error,         emoji: '❌' },
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'PIX 💠', credit_card: 'Crédito 💳', debit_card: 'Débito 💳', cash: 'Dinheiro 💵',
};

const ROLE_LABEL: Record<string, { label: string; color: string; emoji: string }> = {
  customer:    { label: 'Cliente',         color: '#64B5F6', emoji: '🎬' },
  seller:      { label: 'Vendedor',        color: COLORS.warning, emoji: '🏪' },
  manager:     { label: 'Gerente',         color: '#CE93D8', emoji: '📊' },
  super_admin: { label: 'Administrador',   color: COLORS.gold, emoji: '👑' },
};

export default function ContaScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<TabType>('perfil');
  const [orders, setOrders] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, moviesRes] = await Promise.all([getOrders(), getMovies()]);
      setOrders(ordersRes.data);
      setMovies(moviesRes.data);
    } catch (e) {
      console.error('Erro conta:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert('Sair', 'Deseja sair da sua conta?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => logout().catch(e => console.error('Erro logout:', e)),
        },
      ]);
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout().catch(e => console.error('Erro logout:', e));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const totalGasto = orders
    .filter(o => o.payment_status === 'approved')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const pedidosConcluidos = orders.filter(o => o.status === 'delivered').length;
  const role = ROLE_LABEL[user?.role || 'customer'];

  const TABS: { key: TabType; label: string; emoji: string }[] = [
    { key: 'perfil',  label: 'Perfil',   emoji: '👤' },
    { key: 'pipocas', label: 'Pipocas',  emoji: '🍿' },
    { key: 'sessoes', label: 'Sessões',  emoji: '🎬' },
  ];

  return (
    <View style={styles.container}>

      {/* Modal de confirmação web */}
      <Modal transparent visible={showLogoutModal} animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🚪 Sair da conta</Text>
            <Text style={styles.modalMsg}>Deseja realmente sair da sua conta?</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmLogout}>
                <Text style={styles.modalBtnConfirmText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: role.color + '22' }]}>
              <Text style={[styles.roleText, { color: role.color }]}>{role.emoji} {role.label}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Luzes */}
      <View style={styles.lightsRow}>
        {[...Array(12)].map((_, i) => (
          <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
        >

          {/* ── PERFIL ── */}
          {tab === 'perfil' && (
            <>
              {/* Stats */}
              <View style={styles.statsGrid}>
                {[
                  { label: 'Total pedidos', value: orders.length,         icon: '📋', color: '#64B5F6' },
                  { label: 'Concluídos',    value: pedidosConcluidos,     icon: '✅', color: COLORS.success },
                  { label: 'Total gasto',   value: `R$${totalGasto.toFixed(0)}`, icon: '💰', color: COLORS.gold },
                  { label: 'Sessões',       value: movies.length,         icon: '🎬', color: '#CE93D8' },
                ].map((s, i) => (
                  <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
                    <Text style={styles.statIcon}>{s.icon}</Text>
                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Info da conta */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Informações da conta</Text>
                {[
                  { label: '👤 Nome',    value: user?.name },
                  { label: '📧 Email',   value: user?.email },
                  { label: '📱 Telefone',value: user?.phone || 'Não informado' },
                  { label: '🏷️ Perfil',  value: `${role.emoji} ${role.label}` },
                ].map((row, i, arr) => (
                  <View key={i} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoValue}>{row.value}</Text>
                  </View>
                ))}
              </View>

              {/* Último pedido */}
              {orders.length > 0 && (() => {
                const last = orders[0];
                const s = STATUS_MAP[last.status];
                return (
                  <View style={styles.lastOrderCard}>
                    <Text style={styles.infoCardTitle}>Último pedido</Text>
                    <View style={styles.lastOrderRow}>
                      <Text style={styles.lastOrderEmoji}>{s?.emoji || '📋'}</Text>
                      <View style={{ flex: 1, marginLeft: SPACING.md }}>
                        <Text style={styles.lastOrderId}>Pedido #{last.id}</Text>
                        <Text style={styles.lastOrderDate}>{formatDateTime(last.created_at)}</Text>
                      </View>
                      <Text style={styles.lastOrderTotal}>R$ {Number(last.total).toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Botão sair */}
              <TouchableOpacity style={styles.logoutBtnFull} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>🚪 Sair da conta</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── HISTÓRICO PIPOCAS ── */}
          {tab === 'pipocas' && (
            <>
              {/* Resumo */}
              <View style={styles.resumoRow}>
                <View style={styles.resumoCard}>
                  <Text style={styles.resumoValue}>{orders.length}</Text>
                  <Text style={styles.resumoLabel}>Pedidos</Text>
                </View>
                <View style={styles.resumoCard}>
                  <Text style={[styles.resumoValue, { color: COLORS.gold }]}>R$ {totalGasto.toFixed(2)}</Text>
                  <Text style={styles.resumoLabel}>Gasto aprovado</Text>
                </View>
              </View>

              {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🍿</Text>
                  <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
                  <Text style={styles.emptyText}>Seus pedidos de pipoca aparecerão aqui.</Text>
                  <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Cardapio')}>
                    <Text style={styles.ctaBtnText}>🍿 Ir ao cardápio</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                orders.map(order => {
                  const s = STATUS_MAP[order.status] || { label: order.status, color: '#aaa', emoji: '❓' };
                  return (
                    <View key={order.id} style={styles.historyCard}>
                      <View style={[styles.historyStatusBar, { backgroundColor: s.color }]} />
                      <View style={styles.historyCardContent}>
                        <View style={styles.historyCardHeader}>
                          <View>
                            <Text style={styles.historyCardId}>Pedido #{order.id}</Text>
                            <Text style={styles.historyCardDate}>{formatDateTime(order.created_at)}</Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: s.color + '22' }]}>
                            <Text style={[styles.statusText, { color: s.color }]}>{s.emoji} {s.label}</Text>
                          </View>
                        </View>
                        <View style={styles.historyCardDivider} />
                        <View style={styles.historyCardFooter}>
                          <View>
                            <Text style={styles.historyTicket}>🎫 {order.ticket_code}</Text>
                            <Text style={styles.historyPayment}>{PAYMENT_LABEL[order.payment_method] || order.payment_method}</Text>
                          </View>
                          <Text style={styles.historyTotal}>R$ {Number(order.total).toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* ── HISTÓRICO SESSÕES ── */}
          {tab === 'sessoes' && (
            <>
              <View style={styles.resumoRow}>
                <View style={styles.resumoCard}>
                  <Text style={styles.resumoValue}>{movies.length}</Text>
                  <Text style={styles.resumoLabel}>Sessões disponíveis</Text>
                </View>
                <View style={styles.resumoCard}>
                  <Text style={[styles.resumoValue, { color: '#CE93D8' }]}>
                    {movies.filter(m => new Date(m.session_date) >= new Date()).length}
                  </Text>
                  <Text style={styles.resumoLabel}>Próximas</Text>
                </View>
              </View>

              {movies.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🎬</Text>
                  <Text style={styles.emptyTitle}>Nenhuma sessão disponível</Text>
                  <Text style={styles.emptyText}>As sessões de filmes aparecerão aqui.</Text>
                  <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Sessoes')}>
                    <Text style={styles.ctaBtnText}>🎬 Ver sessões</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                movies.map(movie => {
                  const isPast = new Date(movie.session_date) < new Date();
                  return (
                    <View key={movie.id} style={[styles.movieCard, isPast && { opacity: 0.6 }]}>
                      <View style={styles.moviePoster}>
                        <Text style={styles.moviePosterEmoji}>🎬</Text>
                        {isPast && (
                          <View style={styles.pastBadge}>
                            <Text style={styles.pastBadgeText}>Encerrado</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.movieInfo}>
                        <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
                        {movie.genre ? <Text style={styles.movieGenre}>{movie.genre}</Text> : null}
                        <View style={styles.movieMeta}>
                          <Text style={styles.movieDate}>
                            📅 {formatDate(movie.session_date)}
                          </Text>
                          <View style={styles.movieTimeBadge}>
                            <Text style={styles.movieTime}>{movie.session_time?.slice(0, 5)}</Text>
                          </View>
                        </View>
                        {movie.room ? <Text style={styles.movieRoom}>🏛 {movie.room}</Text> : null}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.xxl, backgroundColor: COLORS.surface },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primaryDark },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userName: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, marginTop: 3, alignSelf: 'flex-start' },
  roleText: { fontSize: 11, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  logoutText: { color: COLORS.error, fontSize: 13, fontWeight: 'bold' },
  lightsRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: '#222' },
  light: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  lightGold: { backgroundColor: '#FFD700' },
  tabRow: { flexDirection: 'row', margin: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 11, borderRadius: RADIUS.sm, gap: 4 },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabEmoji: { fontSize: 14 },
  tabLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderTopWidth: 3, ...SHADOW.small },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  // Info
  infoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#2a2a2a' },
  infoCardTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  infoLabel: { color: COLORS.textSecondary, fontSize: 14 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  // Último pedido
  lastOrderCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#2a2a2a' },
  lastOrderRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  lastOrderEmoji: { fontSize: 30 },
  lastOrderId: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  lastOrderDate: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  lastOrderTotal: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold' },
  // Logout full
  logoutBtnFull: { borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.error, marginTop: SPACING.sm },
  logoutBtnText: { color: COLORS.error, fontSize: 15, fontWeight: 'bold' },
  // Resumo
  resumoRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  resumoCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  resumoValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  resumoLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  // Histórico pipocas
  historyCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2a2a', marginBottom: SPACING.sm, ...SHADOW.small },
  historyStatusBar: { width: 5 },
  historyCardContent: { flex: 1, padding: SPACING.md },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  historyCardId: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  historyCardDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  historyCardDivider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: SPACING.sm },
  historyCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTicket: { color: COLORS.primary, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  historyPayment: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  historyTotal: { color: COLORS.gold, fontSize: 15, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  // Sessões
  movieCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2a2a', marginBottom: SPACING.sm, ...SHADOW.small },
  moviePoster: { width: 80, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  moviePosterEmoji: { fontSize: 34 },
  pastBadge: { position: 'absolute', bottom: 6, backgroundColor: '#333', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  pastBadgeText: { color: '#aaa', fontSize: 9, fontWeight: 'bold' },
  movieInfo: { flex: 1, padding: SPACING.md },
  movieTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  movieGenre: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  movieMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  movieDate: { fontSize: 12, color: COLORS.textSecondary },
  movieTimeBadge: { backgroundColor: COLORS.primary, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  movieTime: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  movieRoom: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: SPACING.sm },
  ctaBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: SPACING.xl, marginTop: SPACING.lg },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  // Modal logout (web)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.xl, width: 300, borderWidth: 1, borderColor: '#333' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  modalMsg: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  modalBtns: { flexDirection: 'row', gap: SPACING.sm },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight, alignItems: 'center' },
  modalBtnCancelText: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
  modalBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.error, alignItems: 'center' },
  modalBtnConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
