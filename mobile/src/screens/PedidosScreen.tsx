import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, ScrollView, Alert, Image
} from 'react-native';
import { useCart } from '../context/CartContext';
import { getOrders, createOrder, getMovieSessions } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

type TabType = 'cart' | 'history';

const STATUS_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  pending:   { label: 'Aguardando', color: COLORS.warning,       emoji: '⏳' },
  confirmed: { label: 'Confirmado', color: '#64B5F6',            emoji: '✅' },
  preparing: { label: 'Preparando', color: '#FF9800',            emoji: '🍿' },
  ready:     { label: 'Pronto!',    color: COLORS.success,       emoji: '🎉' },
  delivered: { label: 'Entregue',   color: COLORS.textSecondary, emoji: '📦' },
  cancelled: { label: 'Cancelado',  color: COLORS.error,         emoji: '❌' },
};

const PAYMENT_METHODS = [
  { id: 'pix',         label: 'PIX',     icon: '💠', desc: 'Aprovação imediata' },
  { id: 'credit_card', label: 'Crédito', icon: '💳', desc: 'Até 12x' },
  { id: 'debit_card',  label: 'Débito',  icon: '💳', desc: 'À vista' },
  { id: 'cash',        label: 'Dinheiro',icon: '💵', desc: 'Na retirada' },
];

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'PIX 💠', credit_card: 'Crédito 💳', debit_card: 'Débito 💳', cash: 'Dinheiro 💵',
};

const CATEGORY_EMOJI: Record<string, string> = {
  'Pipoca': '🍿', 'Bebidas': '🥤', 'Combos': '🎬', 'Doces': '🍬',
};

export default function PedidosScreen({ navigation }: any) {
  const [tab, setTab] = useState<TabType>('cart');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getOrders();
      setOrders(res.data);
    } catch (e) {
      console.error('Erro pedidos:', e);
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  // Carrega sessões ao montar
  useEffect(() => {
    getMovieSessions()
      .then(res => setSessions(res.data))
      .catch(() => {});
  }, []);

  // Quando muda para histórico, atualiza
  useEffect(() => { if (tab === 'history') fetchOrders(); }, [tab]);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckingOut(true);
    try {
      const res = await createOrder({
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        payment_method: paymentMethod,
        session_id: selectedSession?.id || null,
      });
      clearCart();
      setSelectedSession(null);
      navigation.navigate('OrderSuccess', { order: res.data });
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.message || 'Erro ao finalizar pedido.');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Pedidos</Text>
        {tab === 'cart' && itemCount > 0 && (
          <TouchableOpacity onPress={() =>
            Alert.alert('Limpar carrinho', 'Remover todos os itens?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Limpar', style: 'destructive', onPress: clearCart },
            ])
          }>
            <Text style={styles.clearText}>Limpar tudo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Luzes */}
      <View style={styles.lightsRow}>
        {[...Array(12)].map((_, i) => (
          <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'cart' && styles.tabBtnActive]}
          onPress={() => setTab('cart')}
        >
          <Text style={styles.tabEmoji}>🛒</Text>
          <Text style={[styles.tabLabel, tab === 'cart' && styles.tabLabelActive]}>
            Carrinho{itemCount > 0 ? ` (${itemCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
          onPress={() => setTab('history')}
        >
          <Text style={styles.tabEmoji}>📋</Text>
          <Text style={[styles.tabLabel, tab === 'history' && styles.tabLabelActive]}>
            Histórico{orders.length > 0 ? ` (${orders.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─────────── ABA CARRINHO ─────────── */}
      {tab === 'cart' && (
        <>
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyTitle}>Carrinho vazio</Text>
              <Text style={styles.emptyText}>Adicione produtos do cardápio para continuar</Text>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Cardapio')}>
                <Text style={styles.ctaBtnText}>🍿 Ir ao cardápio</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={styles.cartScroll} keyboardShouldPersistTaps="handled">
                {/* Itens */}
                <Text style={styles.sectionTitle}>Seus itens</Text>
                {items.map(item => (
                  <View key={item.id} style={styles.cartItem}>
                    <View style={styles.cartItemEmoji}>
                      <Text style={{ fontSize: 28 }}>🍿</Text>
                    </View>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.cartItemTotal}>R$ {(item.price * item.quantity).toFixed(2)}</Text>
                      <Text style={styles.cartItemUnit}>R$ {item.price.toFixed(2)} un.</Text>
                    </View>
                    <View style={styles.qtyControl}>
                      <TouchableOpacity style={styles.qBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Text style={styles.qBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity style={styles.qBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Text style={styles.qBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Resumo */}
                <View style={styles.summaryCard}>
                  <Text style={styles.sectionTitle}>Resumo do pedido</Text>
                  {items.map(item => (
                    <View key={item.id} style={styles.summaryRow}>
                      <Text style={styles.summaryItem}>{item.name} ×{item.quantity}</Text>
                      <Text style={styles.summaryVal}>R$ {(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={[styles.summaryRow, { borderBottomWidth: 0, marginTop: 6 }]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Sessão do filme */}
                <Text style={styles.sectionTitle}>Sessão do filme</Text>
                <TouchableOpacity
                  style={styles.sessionPicker}
                  onPress={() => setShowSessionPicker(true)}
                >
                  <View style={{ flex: 1 }}>
                    {selectedSession ? (
                      <>
                        <Text style={styles.sessionPickerTitle} numberOfLines={1}>{selectedSession.movie_title || 'Filme'}</Text>
                        <Text style={styles.sessionPickerSub}>
                          {selectedSession.session_date?.slice(0, 10)} • {selectedSession.session_time?.slice(0, 5)}{selectedSession.room ? ` • ${selectedSession.room}` : ''}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.sessionPickerPlaceholder}>🎬 Selecionar sessão (opcional)</Text>
                    )}
                  </View>
                  <Text style={{ color: COLORS.primary, fontSize: 18 }}>›</Text>
                </TouchableOpacity>

                {/* Pagamento */}
                <Text style={styles.sectionTitle}>Forma de pagamento</Text>
                <View style={styles.paymentGrid}>
                  {PAYMENT_METHODS.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.paymentOption, paymentMethod === m.id && styles.paymentOptionActive]}
                      onPress={() => setPaymentMethod(m.id)}
                    >
                      <Text style={styles.paymentIcon}>{m.icon}</Text>
                      <Text style={[styles.paymentLabel, paymentMethod === m.id && styles.paymentLabelActive]}>{m.label}</Text>
                      <Text style={styles.paymentDesc}>{m.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Footer fixo */}
              <View style={styles.checkoutFooter}>
                <TouchableOpacity
                  style={[styles.checkoutBtn, checkingOut && { opacity: 0.6 }]}
                  onPress={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.checkoutBtnText}>🎬 Finalizar • R$ {total.toFixed(2)}</Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}

      {/* ─────────── ABA HISTÓRICO ─────────── */}
      {tab === 'history' && (
        loadingOrders ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.historyList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.primary} />
            }
            renderItem={({ item }) => {
              const status = STATUS_MAP[item.status] || { label: item.status, color: '#aaa', emoji: '❓' };
              return (
                <TouchableOpacity style={styles.orderCard} onPress={() => setSelectedOrder(item)} activeOpacity={0.85}>
                  <View style={[styles.orderStatusBar, { backgroundColor: status.color }]} />
                  <View style={styles.orderCardContent}>
                    <View style={styles.orderCardHeader}>
                      <View>
                        <Text style={styles.orderCardId}>Pedido #{item.id}</Text>
                        <Text style={styles.orderCardDate}>{formatDate(item.created_at)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.emoji} {status.label}</Text>
                      </View>
                    </View>
                    <View style={styles.orderCardDivider} />
                    <View style={styles.orderCardFooter}>
                      <Text style={styles.orderCardTicket}>🎫 {item.ticket_code}</Text>
                      <Text style={styles.orderCardTotal}>R$ {Number(item.total).toFixed(2)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
                <Text style={styles.emptyText}>Seus pedidos aparecerão aqui após finalizar no carrinho.</Text>
              </View>
            }
          />
        )
      )}

      {/* Modal seletor de sessão */}
      <Modal visible={showSessionPicker} animationType="slide" transparent onRequestClose={() => setShowSessionPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={{ padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#2a2a2a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text }}>🎬 Escolha a sessão</Text>
              <TouchableOpacity onPress={() => setShowSessionPicker(false)}>
                <Text style={{ color: COLORS.textMuted, fontSize: 15 }}>Fechar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {/* Opção nenhuma */}
              <TouchableOpacity
                style={[styles.sessionOption, !selectedSession && styles.sessionOptionActive]}
                onPress={() => { setSelectedSession(null); setShowSessionPicker(false); }}
              >
                <Text style={styles.sessionOptionEmoji}>🚫</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionOptionTitle, !selectedSession && { color: COLORS.primary }]}>Sem sessão</Text>
                  <Text style={styles.sessionOptionSub}>Compra avulsa de pipoca</Text>
                </View>
              </TouchableOpacity>
              {sessions.length === 0 && (
                <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.textSecondary }}>Nenhuma sessão disponível</Text>
                </View>
              )}
              {sessions.map((s: any) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sessionOption, selectedSession?.id === s.id && styles.sessionOptionActive]}
                  onPress={() => { setSelectedSession(s); setShowSessionPicker(false); }}
                >
                  <Text style={styles.sessionOptionEmoji}>🎬</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionOptionTitle, selectedSession?.id === s.id && { color: COLORS.primary }]} numberOfLines={1}>
                      {s.movie_title || s.title || 'Filme'}
                    </Text>
                    <Text style={styles.sessionOptionSub}>
                      {s.session_date?.slice(0, 10)} • {s.session_time?.slice(0, 5)}{s.room ? ` • ${s.room}` : ''}
                    </Text>
                  </View>
                  {selectedSession?.id === s.id && <Text style={{ color: COLORS.primary, fontSize: 18 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal detalhe do pedido */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            {selectedOrder && (() => {
              const status = STATUS_MAP[selectedOrder.status] || { label: selectedOrder.status, color: '#aaa', emoji: '❓' };
              return (
                <ScrollView>
                  <View style={[styles.detailHero, { backgroundColor: status.color + '22' }]}>
                    <Text style={styles.detailHeroEmoji}>{status.emoji}</Text>
                    <Text style={[styles.detailHeroStatus, { color: status.color }]}>{status.label}</Text>
                    <Text style={styles.detailHeroId}>Pedido #{selectedOrder.id}</Text>
                  </View>
                  <View style={styles.detailBody}>
                    <View style={styles.ticketBox}>
                      <Text style={styles.ticketBoxLabel}>🎫 Código do Ticket</Text>
                      <Text style={styles.ticketBoxCode}>{selectedOrder.ticket_code}</Text>
                      {/* QR Code via URL – funciona com internet */}
                      <Image
                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(selectedOrder.ticket_code)}&bgcolor=E50914&color=ffffff&margin=4` }}
                        style={{ width: 100, height: 100, marginTop: 8, borderRadius: 8 }}
                      />
                      <Text style={styles.ticketBoxHint}>Apresente na retirada</Text>
                    </View>
                    {[
                      { label: 'Data', value: formatDate(selectedOrder.created_at) },
                      { label: 'Pagamento', value: PAYMENT_LABEL[selectedOrder.payment_method] || selectedOrder.payment_method },
                      { label: 'Status pag.', value: selectedOrder.payment_status === 'approved' ? '✅ Aprovado' : '⏳ Pendente' },
                      { label: 'Total', value: `R$ ${Number(selectedOrder.total).toFixed(2)}`, bold: true },
                    ].map((row, i, arr) => (
                      <View key={i} style={[styles.detailRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                        <Text style={styles.detailLabel}>{row.label}</Text>
                        <Text style={[styles.detailValue, row.bold && { color: COLORS.gold, fontSize: 18 }]}>{row.value}</Text>
                      </View>
                    ))}
                    <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedOrder(null)}>
                      <Text style={styles.closeModalText}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.xxl, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  clearText: { color: COLORS.error, fontSize: 13, fontWeight: '600' },
  lightsRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: '#222' },
  light: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  lightGold: { backgroundColor: '#FFD700' },
  tabRow: { flexDirection: 'row', margin: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 11, borderRadius: RADIUS.sm, gap: 5 },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabEmoji: { fontSize: 14 },
  tabLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },
  // Carrinho
  cartScroll: { padding: SPACING.md, paddingBottom: 130 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#2a2a2a', ...SHADOW.small },
  cartItemEmoji: { width: 50, height: 50, backgroundColor: '#111', borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  cartItemInfo: { flex: 1, marginLeft: SPACING.md },
  cartItemName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  cartItemTotal: { fontSize: 15, color: COLORS.gold, fontWeight: 'bold', marginTop: 2 },
  cartItemUnit: { fontSize: 11, color: COLORS.textMuted },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qBtn: { width: 32, height: 32, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  qBtnText: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', lineHeight: 22 },
  qtyText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', minWidth: 22, textAlign: 'center' },
  summaryCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#2a2a2a' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  summaryItem: { color: COLORS.textSecondary, fontSize: 13 },
  summaryVal: { color: COLORS.text, fontSize: 13 },
  totalLabel: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  totalValue: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold' },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  paymentOption: { flex: 1, minWidth: '45%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 2, borderColor: COLORS.border },
  paymentOptionActive: { borderColor: COLORS.primary, backgroundColor: '#2a0005' },
  paymentIcon: { fontSize: 24 },
  paymentLabel: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, fontWeight: '700' },
  paymentLabelActive: { color: '#fff' },
  paymentDesc: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  checkoutFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, padding: SPACING.md, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  checkoutBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, marginTop: 60 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: SPACING.sm },
  ctaBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 13, paddingHorizontal: SPACING.xl, marginTop: SPACING.xl },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  // Histórico
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  historyList: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xxl },
  orderCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2a2a', ...SHADOW.small },
  orderStatusBar: { width: 5 },
  orderCardContent: { flex: 1, padding: SPACING.md },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderCardId: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  orderCardDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  orderCardDivider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: SPACING.sm },
  orderCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCardTicket: { color: COLORS.primary, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  orderCardTotal: { color: COLORS.gold, fontSize: 15, fontWeight: 'bold' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  detailModal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  detailHero: { padding: SPACING.xl, alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailHeroEmoji: { fontSize: 52 },
  detailHeroStatus: { fontSize: 20, fontWeight: 'bold', marginTop: SPACING.sm },
  detailHeroId: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  detailBody: { padding: SPACING.lg },
  ticketBox: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md },
  ticketBoxLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  ticketBoxCode: { color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: 4, marginTop: 6 },
  ticketBoxHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  detailLabel: { color: COLORS.textSecondary, fontSize: 14 },
  detailValue: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  closeModalBtn: { marginTop: SPACING.lg, paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  closeModalText: { color: COLORS.textMuted, fontSize: 15 },
  // Session picker
  sessionPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#2a2a2a' },
  sessionPickerTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  sessionPickerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  sessionPickerPlaceholder: { color: COLORS.textMuted, fontSize: 14 },
  sessionOption: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', gap: 12 },
  sessionOptionActive: { backgroundColor: '#2a0005' },
  sessionOptionEmoji: { fontSize: 22 },
  sessionOptionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  sessionOptionSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});
