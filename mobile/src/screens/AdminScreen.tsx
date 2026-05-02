import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { getOrders, updateOrderStatus, getProducts, getMovies } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
const STATUS_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  pending:   { label: 'Aguardando', color: COLORS.warning,       emoji: '⏳' },
  confirmed: { label: 'Confirmado', color: '#64B5F6',            emoji: '✅' },
  preparing: { label: 'Preparando', color: '#FF9800',            emoji: '🍿' },
  ready:     { label: 'Pronto!',    color: COLORS.success,       emoji: '🎉' },
  delivered: { label: 'Entregue',   color: COLORS.textSecondary, emoji: '📦' },
  cancelled: { label: 'Cancelado',  color: COLORS.error,         emoji: '❌' },
};

type TabType = 'orders' | 'products' | 'movies';

export default function AdminScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [ordersRes, productsRes, moviesRes] = await Promise.all([
        getOrders(),
        getProducts(),
        getMovies(),
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setMovies(moviesRes.data);
    } catch (e) {
      console.error('Erro ao buscar dados admin:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const handleStatusChange = (orderId: number, currentStatus: string) => {
    const options = STATUS_OPTIONS.filter(s => s !== currentStatus).map(s => ({
      text: `${STATUS_MAP[s].emoji} ${STATUS_MAP[s].label}`,
      onPress: async () => {
        try {
          await updateOrderStatus(orderId, s);
          fetchAll();
        } catch {
          Alert.alert('Erro', 'Não foi possível atualizar o status.');
        }
      },
    }));
    Alert.alert('Atualizar Status', 'Selecione o novo status:', [
      ...options,
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  const stats = [
    { label: 'Pedidos', value: orders.length,                                               icon: '📋', color: '#64B5F6' },
    { label: 'Aguardando', value: orders.filter(o => o.status === 'pending').length,        icon: '⏳', color: COLORS.warning },
    { label: 'Prontos',    value: orders.filter(o => o.status === 'ready').length,          icon: '🎉', color: COLORS.success },
    { label: 'Produtos',   value: products.length,                                          icon: '🍿', color: COLORS.primary },
    { label: 'Sessões',    value: movies.length,                                            icon: '🎬', color: '#CE93D8' },
    { label: 'Faturado',   value: `R$${orders.filter(o => o.payment_status === 'approved').reduce((s: number, o: any) => s + Number(o.total), 0).toFixed(0)}`, icon: '💰', color: COLORS.gold },
  ];

  if (loading) return (
    <View style={styles.loadingContainer}>
      <Text style={{ fontSize: 52 }}>⚙️</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.md }} />
      <Text style={styles.loadingText}>Carregando painel...</Text>
    </View>
  );

  const TABS: { key: TabType; label: string; emoji: string }[] = [
    { key: 'orders',   label: 'Pedidos',  emoji: '📋' },
    { key: 'products', label: 'Produtos', emoji: '🍿' },
    { key: 'movies',   label: 'Sessões',  emoji: '🎬' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚙️ Painel</Text>
          <Text style={styles.headerSub}>{user?.name} • <Text style={{ color: COLORS.primary }}>{user?.role}</Text></Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={COLORS.primary} />}
      >
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
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

        {/* Conteúdo da tab */}
        <View style={styles.tabContent}>

          {/* Tab: Pedidos */}
          {tab === 'orders' && (
            orders.length === 0
              ? <View style={styles.empty}><Text style={styles.emptyText}>Nenhum pedido encontrado.</Text></View>
              : orders.map((item: any) => {
                  const status = STATUS_MAP[item.status] || { label: item.status, color: '#aaa', emoji: '❓' };
                  return (
                    <View key={item.id} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <Text style={styles.orderId}>Pedido #{item.id}</Text>
                        <TouchableOpacity
                          style={[styles.statusBadge, { backgroundColor: status.color + '33' }]}
                          onPress={() => handleStatusChange(item.id, item.status)}
                        >
                          <Text style={[styles.statusText, { color: status.color }]}>
                            {status.emoji} {status.label} ✏️
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.orderMeta}>
                        <Text style={styles.orderCustomer}>👤 {item.customer_name}</Text>
                        <Text style={styles.orderTicket}>🎫 {item.ticket_code}</Text>
                        <View style={styles.orderFooter}>
                          <Text style={styles.orderTotal}>💰 R$ {Number(item.total).toFixed(2)}</Text>
                          <Text style={styles.orderDate}>
                            {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
          )}

          {/* Tab: Produtos */}
          {tab === 'products' && (
            products.length === 0
              ? <View style={styles.empty}><Text style={styles.emptyText}>Nenhum produto cadastrado.</Text></View>
              : products.map((p: any) => (
                  <View key={p.id} style={styles.productCard}>
                    <View style={styles.productEmoji}>
                      <Text style={{ fontSize: 28 }}>
                        {p.category_name === 'Pipoca' ? '🍿' : p.category_name === 'Bebidas' ? '🥤' : p.category_name === 'Combos' ? '🎬' : '🍬'}
                      </Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productCat}>{p.category_name}</Text>
                    </View>
                    <View style={styles.productRight}>
                      <Text style={styles.productPrice}>R$ {Number(p.price).toFixed(2)}</Text>
                      <View style={[styles.stockBadge, { backgroundColor: p.stock <= 5 ? COLORS.warning + '33' : COLORS.success + '22' }]}>
                        <Text style={[styles.stockText, { color: p.stock <= 5 ? COLORS.warning : COLORS.success }]}>
                          {p.stock} un.
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
          )}

          {/* Tab: Sessões */}
          {tab === 'movies' && (
            movies.length === 0
              ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>Nenhuma sessão cadastrada.</Text>
                  <TouchableOpacity style={styles.goBtn} onPress={() => navigation.navigate('Movies')}>
                    <Text style={styles.goBtnText}>Gerenciar sessões</Text>
                  </TouchableOpacity>
                </View>
              )
              : movies.map((m: any) => (
                  <View key={m.id} style={styles.movieCard}>
                    <View style={styles.movieEmoji}>
                      <Text style={{ fontSize: 28 }}>🎬</Text>
                    </View>
                    <View style={styles.movieInfo}>
                      <Text style={styles.movieTitle} numberOfLines={1}>{m.title}</Text>
                      <Text style={styles.movieMeta}>{m.session_date?.slice(0, 10)} • {m.session_time?.slice(0, 5)}</Text>
                      {m.room ? <Text style={styles.movieRoom}>{m.room}</Text> : null}
                    </View>
                    <TouchableOpacity style={styles.editChip} onPress={() => navigation.navigate('Movies')}>
                      <Text style={styles.editChipText}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                ))
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm, fontSize: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.xxl, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  logoutBtn: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  logoutText: { color: COLORS.error, fontSize: 14, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.sm, gap: SPACING.sm, paddingHorizontal: SPACING.md },
  statCard: { flex: 1, minWidth: '28%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderTopWidth: 3, ...SHADOW.small },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  tabRow: { flexDirection: 'row', marginHorizontal: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 4, gap: 4, marginBottom: SPACING.sm },
  tabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: RADIUS.sm, gap: 4 },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabEmoji: { fontSize: 14 },
  tabLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: '#fff' },
  tabContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
  // Orders
  orderCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#2a2a2a' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  orderMeta: { marginTop: SPACING.sm, gap: 4 },
  orderCustomer: { color: COLORS.textSecondary, fontSize: 13 },
  orderTicket: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  orderTotal: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold' },
  orderDate: { color: COLORS.textMuted, fontSize: 12 },
  // Products
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#2a2a2a' },
  productEmoji: { width: 46, height: 46, backgroundColor: '#111', borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1, marginLeft: SPACING.md },
  productName: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  productCat: { color: COLORS.primary, fontSize: 12, marginTop: 2 },
  productRight: { alignItems: 'flex-end', gap: 4 },
  productPrice: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold' },
  stockBadge: { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 2 },
  stockText: { fontSize: 11, fontWeight: 'bold' },
  // Movies
  movieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#2a2a2a' },
  movieEmoji: { width: 46, height: 46, backgroundColor: '#111', borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  movieInfo: { flex: 1, marginLeft: SPACING.md },
  movieTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  movieMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  movieRoom: { color: COLORS.primary, fontSize: 11, marginTop: 2 },
  editChip: { width: 36, height: 36, backgroundColor: '#1a3a5c', borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  editChipText: { fontSize: 18 },
  // Empty
  empty: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
  goBtn: { marginTop: SPACING.md, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: 10 },
  goBtnText: { color: '#fff', fontWeight: 'bold' },
});
