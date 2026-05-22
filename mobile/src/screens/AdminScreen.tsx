import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert, ScrollView,
  Modal, TextInput, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import {
  getOrders, updateOrderStatus,
  getProducts, createProduct, updateProduct, deleteProduct,
  getMovies, deleteMovie,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

const POSTER_PLACEHOLDER = require('../../assets/Image-not-found.png');

const isValidPosterUrl = (url?: string): boolean => {
  return !!(url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://')));
};

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

const EMPTY_PRODUCT = { name: '', price: '', stock: '', description: '', image_url: '', category_name: '' };

export default function AdminScreen({ navigation }: any) {
  const { user, logout, isSuperAdmin } = useAuth();
  const [tab, setTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Estado modal produto ──────────────────────────────
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [savingProduct, setSavingProduct] = useState(false);

  // ── Produto handlers ──────────────────────────────────
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductModal(true);
  };

  const openEditProduct = (p: any) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name || '',
      price: String(p.price || ''),
      stock: String(p.stock || ''),
      description: p.description || '',
      image_url: p.image_url || '',
      category_name: p.category_name || '',
    });
    setProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) { Alert.alert('Atenção', 'Nome é obrigatório.'); return; }
    const price = parseFloat(productForm.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) { Alert.alert('Atenção', 'Preço inválido.'); return; }
    const stock = parseInt(productForm.stock) || 0;
    setSavingProduct(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        price, stock,
        description: productForm.description.trim(),
        image_url: productForm.image_url.trim(),
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      setProductModal(false);
      fetchAll();
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message || 'Erro ao salvar produto.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = (p: any) => {
    Alert.alert('Excluir produto', `Tem certeza que deseja excluir "${p.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try { await deleteProduct(p.id); fetchAll(); }
          catch (e: any) { Alert.alert('Erro', e?.response?.data?.message || 'Erro ao excluir.'); }
        },
      },
    ]);
  };

  // ── Filme handlers → navega para tela dedicada ────────
  const openCreateMovie = () => {
    navigation.navigate('CreateMovie');
  };

  const openEditMovie = (m: any) => {
    navigation.navigate('CreateMovie', { movie: m });
  };

  const handleDeleteMovie = (m: any) => {
    Alert.alert('Remover filme', `Deseja remover "${m.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try { await deleteMovie(m.id); fetchAll(); }
          catch { Alert.alert('Erro', 'Não foi possível remover.'); }
        }
      }
    ]);
  };

  // ── Fetch ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [ordersRes, productsRes, moviesRes] = await Promise.all([
        getOrders(), getProducts(), getMovies(),
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

  // Recarrega ao voltar para esta tela (após criar/editar filme)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAll();
    });
    return unsubscribe;
  }, [navigation]);

  const handleStatusChange = (orderId: number, currentStatus: string) => {
    const options = STATUS_OPTIONS.filter(s => s !== currentStatus).map(s => ({
      text: `${STATUS_MAP[s].emoji} ${STATUS_MAP[s].label}`,
      onPress: async () => {
        try { await updateOrderStatus(orderId, s); fetchAll(); }
        catch { Alert.alert('Erro', 'Não foi possível atualizar o status.'); }
      },
    }));
    Alert.alert('Atualizar Status', 'Selecione o novo status:', [
      ...options,
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  const stats = [
    { label: 'Pedidos',    value: orders.length,                                                icon: '📋', color: '#64B5F6' },
    { label: 'Aguardando', value: orders.filter(o => o.status === 'pending').length,            icon: '⏳', color: COLORS.warning },
    { label: 'Prontos',    value: orders.filter(o => o.status === 'ready').length,              icon: '🎉', color: COLORS.success },
    { label: 'Produtos',   value: products.length,                                              icon: '🍿', color: COLORS.primary },
    { label: 'Sessões',    value: movies.length,                                                icon: '🎬', color: '#CE93D8' },
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
    { key: 'movies',   label: 'Filmes',   emoji: '🎬' },
  ];
  const visibleTabs = isSuperAdmin ? TABS : TABS.filter(tab => tab.key !== 'products');

  useEffect(() => {
    if (!isSuperAdmin && tab === 'products') {
      setTab('orders');
    }
  }, [isSuperAdmin, tab]);

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

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={COLORS.primary} />}>
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
          {visibleTabs.map(t => (
            <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
              <Text style={styles.tabEmoji}>{t.emoji}</Text>
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>

          {/* ── Tab: Pedidos ── */}
          {tab === 'orders' && (
            orders.length === 0
              ? <View style={styles.empty}><Text style={styles.emptyText}>Nenhum pedido encontrado.</Text></View>
              : orders.map((item: any) => {
                  const status = STATUS_MAP[item.status] || { label: item.status, color: '#aaa', emoji: '❓' };
                  return (
                    <View key={item.id} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <Text style={styles.orderId}>Pedido #{item.id}</Text>
                        <TouchableOpacity style={[styles.statusBadge, { backgroundColor: status.color + '33' }]} onPress={() => handleStatusChange(item.id, item.status)}>
                          <Text style={[styles.statusText, { color: status.color }]}>{status.emoji} {status.label} ✏️</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.orderMeta}>
                        <Text style={styles.orderCustomer}>👤 {item.customer_name}</Text>
                        <Text style={styles.orderTicket}>🎫 {item.ticket_code}</Text>
                        <View style={styles.orderFooter}>
                          <Text style={styles.orderTotal}>💰 R$ {Number(item.total).toFixed(2)}</Text>
                          <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
          )}

          {/* ── Tab: Produtos ── */}
          {tab === 'products' && isSuperAdmin && (
            <>
              <TouchableOpacity style={styles.newItemBtn} onPress={openCreateProduct}>
                <Text style={styles.newItemBtnText}>+ Novo produto</Text>
              </TouchableOpacity>
              {products.length === 0
                ? <View style={styles.empty}><Text style={styles.emptyText}>Nenhum produto cadastrado.</Text></View>
                : products.map((p: any) => (
                    <View key={p.id} style={styles.productCard}>
                      <View style={styles.productEmoji}>
                        <Text style={{ fontSize: 28 }}>
                          {p.category_name === 'Pipoca' ? '🍿' : p.category_name === 'Bebidas' ? '🥤' : p.category_name === 'Combos' ? '🎦' : '🍬'}
                        </Text>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{p.name}</Text>
                        <Text style={styles.productCat}>{p.category_name}</Text>
                      </View>
                      <View style={styles.productRight}>
                        <Text style={styles.productPrice}>R$ {Number(p.price).toFixed(2)}</Text>
                        <View style={[styles.stockBadge, { backgroundColor: p.stock <= 5 ? COLORS.warning + '33' : COLORS.success + '22' }]}>
                          <Text style={[styles.stockText, { color: p.stock <= 5 ? COLORS.warning : COLORS.success }]}>{p.stock} un.</Text>
                        </View>
                        <View style={styles.productActions}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditProduct(p)}>
                            <Text style={styles.actionBtnText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleDeleteProduct(p)}>
                            <Text style={styles.actionBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
              }
            </>
          )}

          {/* ── Tab: Filmes → abre tela dedicada ── */}
          {tab === 'movies' && (
            <>
              <TouchableOpacity style={styles.newItemBtn} onPress={openCreateMovie}>
                <Text style={styles.newItemBtnText}>🎬 Anunciar novo filme</Text>
              </TouchableOpacity>
              {movies.length === 0
                ? (
                  <View style={styles.empty}>
                    <Text style={{ fontSize: 48 }}>🎞️</Text>
                    <Text style={styles.emptyText}>Nenhum filme cadastrado.</Text>
                    <Text style={styles.emptyHint}>Toque em "Anunciar novo filme" para começar!</Text>
                  </View>
                )
                : movies.map((m: any) => (
                    <View key={m.id} style={styles.movieCard}>
                      <Image
                        source={isValidPosterUrl(m.poster_url) ? { uri: m.poster_url } : POSTER_PLACEHOLDER}
                        style={styles.moviePoster}
                        resizeMode="cover"
                      />
                      <View style={styles.movieInfo}>
                        <Text style={styles.movieTitle} numberOfLines={1}>{m.title}</Text>
                        {m.genre ? <Text style={styles.movieGenre}>{m.genre}</Text> : null}
                        <Text style={styles.movieMeta}>
                          📅 {m.session_date?.slice(0, 10)} • {m.session_time?.slice(0, 5)}
                        </Text>
                        {m.room ? <Text style={styles.movieRoom}>🏛 {m.room}</Text> : null}
                        {m.price > 0 ? <Text style={styles.moviePrice}>💰 R$ {Number(m.price).toFixed(2)}</Text> : null}
                        <View style={[styles.statusPill, {
                          backgroundColor:
                            m.status === 'now_playing' ? COLORS.success + '22' :
                            m.status === 'coming_soon' ? COLORS.primary + '22' : '#33333355'
                        }]}>
                          <Text style={[styles.statusPillText, {
                            color:
                              m.status === 'now_playing' ? COLORS.success :
                              m.status === 'coming_soon' ? COLORS.primary : COLORS.textMuted
                          }]}>
                            {m.status === 'now_playing' ? '🎬 Em cartaz' : m.status === 'coming_soon' ? '📅 Em breve' : '🔚 Encerrado'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.movieActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openEditMovie(m)}>
                          <Text style={styles.actionBtnText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleDeleteMovie(m)}>
                          <Text style={styles.actionBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
              }
            </>
          )}

        </View>
      </ScrollView>

      {/* ── Modal Produto ── */}
      <Modal visible={productModal} animationType="slide" transparent onRequestClose={() => setProductModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>{editingProduct ? 'Editar produto' : 'Novo produto'}</Text>
                {([
                  { key: 'name',        label: 'Nome *',        placeholder: 'Ex: Pipoca Grande',    keyboard: 'default' as const },
                  { key: 'price',       label: 'Preço (R$) *',  placeholder: '12.90',                keyboard: 'decimal-pad' as const },
                  { key: 'stock',       label: 'Estoque (un.)', placeholder: '50',                   keyboard: 'number-pad' as const },
                  { key: 'description', label: 'Descrição',     placeholder: 'Descrição do produto', keyboard: 'default' as const },
                  { key: 'image_url',   label: 'URL da imagem', placeholder: 'https://...',           keyboard: 'url' as const },
                ] as const).map(field => (
                  <View key={field.key} style={styles.modalField}>
                    <Text style={styles.modalLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder={field.placeholder}
                      placeholderTextColor={COLORS.textMuted}
                      value={productForm[field.key]}
                      onChangeText={t => setProductForm(prev => ({ ...prev, [field.key]: t }))}
                      keyboardType={field.keyboard}
                      multiline={field.key === 'description'}
                      numberOfLines={field.key === 'description' ? 3 : 1}
                      editable={!savingProduct}
                    />
                  </View>
                ))}
                <TouchableOpacity style={[styles.modalSaveBtn, savingProduct && { opacity: 0.6 }]} onPress={handleSaveProduct} disabled={savingProduct}>
                  {savingProduct ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveBtnText}>{editingProduct ? 'Salvar alterações' : 'Criar produto'}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setProductModal(false)} disabled={savingProduct}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  // Pedidos
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
  // Produtos
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#2a2a2a' },
  productEmoji: { width: 46, height: 46, backgroundColor: '#111', borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1, marginLeft: SPACING.md },
  productName: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  productCat: { color: COLORS.primary, fontSize: 12, marginTop: 2 },
  productRight: { alignItems: 'flex-end', gap: 4 },
  productPrice: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold' },
  stockBadge: { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 2 },
  stockText: { fontSize: 11, fontWeight: 'bold' },
  // Filmes
  movieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden' },
  moviePoster: { width: 60, height: 90 },
  movieInfo: { flex: 1, padding: SPACING.sm },
  movieTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  movieGenre: { color: COLORS.primary, fontSize: 11, marginTop: 2 },
  movieMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  movieRoom: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  moviePrice: { color: COLORS.gold, fontSize: 12, marginTop: 2, fontWeight: 'bold' },
  movieActions: { paddingRight: SPACING.sm, gap: 6, alignItems: 'center' },
  statusPill: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm, alignSelf: 'flex-start' },
  statusPillText: { fontSize: 10, fontWeight: 'bold' },
  emptyHint: { color: COLORS.textMuted, fontSize: 13, marginTop: 8 },
  // Shared
  newItemBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 11, alignItems: 'center', marginBottom: SPACING.sm },
  newItemBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  productActions: { flexDirection: 'row', gap: 6, marginTop: 4 },
  actionBtn: { width: 32, height: 32, backgroundColor: '#1a3a5c', borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  actionBtnDanger: { backgroundColor: '#3B0000' },
  actionBtnText: { fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { color: COLORS.textSecondary, fontSize: 15, marginTop: SPACING.sm },
  // Modal produto
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
  modalField: { marginBottom: SPACING.md },
  modalLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  modalInput: { backgroundColor: '#111', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: '#333' },
  modalSaveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.sm },
  modalSaveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  modalCancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  modalCancelText: { color: COLORS.textMuted, fontSize: 14 },
});
