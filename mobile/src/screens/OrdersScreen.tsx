import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, ScrollView
} from 'react-native';
import { getOrders } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

const STATUS_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  pending:   { label: 'Aguardando', color: COLORS.warning,       emoji: '⏳' },
  confirmed: { label: 'Confirmado', color: '#64B5F6',            emoji: '✅' },
  preparing: { label: 'Preparando', color: '#FF9800',            emoji: '🍿' },
  ready:     { label: 'Pronto!',    color: COLORS.success,       emoji: '🎉' },
  delivered: { label: 'Entregue',   color: COLORS.textSecondary, emoji: '📦' },
  cancelled: { label: 'Cancelado',  color: COLORS.error,         emoji: '❌' },
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'PIX 💠', credit_card: 'Crédito 💳',
  debit_card: 'Débito 💳', cash: 'Dinheiro 💵',
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getOrders();
      setOrders(res.data);
    } catch (e) {
      console.error('Erro ao buscar pedidos:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return (
    <View style={styles.loadingContainer}>
      <Text style={{ fontSize: 52 }}>📋</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.md }} />
      <Text style={styles.loadingText}>Carregando pedidos...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📋 Meus Pedidos</Text>
          <Text style={styles.headerSub}>{orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Luzes */}
      <View style={styles.lightsRow}>
        {[...Array(10)].map((_, i) => (
          <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.primary} />
        }
        renderItem={({ item }: any) => {
          const status = STATUS_MAP[item.status] || { label: item.status, color: '#aaa', emoji: '❓' };
          return (
            <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.85}>
              {/* Status bar lateral */}
              <View style={[styles.statusBar, { backgroundColor: status.color }]} />

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>Pedido #{item.id}</Text>
                    <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.emoji} {status.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>🎫 Ticket</Text>
                    <Text style={styles.ticketCode}>{item.ticket_code}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>💰 Total</Text>
                    <Text style={styles.totalValue}>R$ {Number(item.total).toFixed(2)}</Text>
                  </View>
                </View>

                <View style={[styles.paymentBadge, { backgroundColor: item.payment_status === 'approved' ? COLORS.success + '22' : COLORS.warning + '22' }]}>
                  <Text style={[styles.paymentText, { color: item.payment_status === 'approved' ? COLORS.success : COLORS.warning }]}>
                    {item.payment_status === 'approved' ? '✅ Pagamento aprovado' : '⏳ Aguardando pagamento'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 64 }}>🎬</Text>
            <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
            <Text style={styles.emptyText}>Que tal pedir uma pipoca para o filme?</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.ctaButtonText}>🍿 Ver cardápio</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal detalhe */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            {selected && (() => {
              const status = STATUS_MAP[selected.status] || { label: selected.status, color: '#aaa', emoji: '❓' };
              return (
                <ScrollView>
                  {/* Status hero */}
                  <View style={[styles.detailHero, { backgroundColor: status.color + '22' }]}>
                    <Text style={styles.detailHeroEmoji}>{status.emoji}</Text>
                    <Text style={[styles.detailHeroStatus, { color: status.color }]}>{status.label}</Text>
                    <Text style={styles.detailHeroId}>Pedido #{selected.id}</Text>
                  </View>

                  <View style={styles.detailBody}>
                    {/* Ticket */}
                    <View style={styles.ticketBox}>
                      <Text style={styles.ticketBoxLabel}>🎫 Código do Ticket</Text>
                      <Text style={styles.ticketBoxCode}>{selected.ticket_code}</Text>
                      <Text style={styles.ticketBoxHint}>Apresente na retirada</Text>
                    </View>

                    {/* Info */}
                    {[
                      { label: 'Data do pedido', value: formatDate(selected.created_at) },
                      { label: 'Pagamento', value: PAYMENT_LABEL[selected.payment_method] || selected.payment_method },
                      { label: 'Status pagamento', value: selected.payment_status === 'approved' ? '✅ Aprovado' : '⏳ Pendente' },
                    ].map((row, i) => (
                      <View key={i} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{row.label}</Text>
                        <Text style={styles.detailValue}>{row.value}</Text>
                      </View>
                    ))}

                    <View style={[styles.detailRow, styles.detailRowTotal]}>
                      <Text style={styles.detailLabelTotal}>Total</Text>
                      <Text style={styles.detailValueTotal}>R$ {Number(selected.total).toFixed(2)}</Text>
                    </View>

                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                      <Text style={styles.closeBtnText}>Fechar</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm, fontSize: 15 },
  header: { padding: SPACING.lg, paddingTop: SPACING.xxl, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  lightsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: '#222' },
  light: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  lightGold: { backgroundColor: '#FFD700' },
  list: { padding: SPACING.md, gap: SPACING.sm },
  card: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.small, borderWidth: 1, borderColor: '#2a2a2a' },
  statusBar: { width: 5 },
  cardContent: { flex: 1, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  orderDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: SPACING.sm },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: {},
  infoLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 2 },
  ticketCode: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  totalValue: { color: COLORS.gold, fontSize: 15, fontWeight: 'bold' },
  paymentBadge: { marginTop: SPACING.sm, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4, alignSelf: 'flex-start' },
  paymentText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.sm, textAlign: 'center' },
  ctaButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 13, paddingHorizontal: SPACING.xl, marginTop: SPACING.xl },
  ctaButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  detailModal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  detailHero: { padding: SPACING.xl, alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailHeroEmoji: { fontSize: 56 },
  detailHeroStatus: { fontSize: 22, fontWeight: 'bold', marginTop: SPACING.sm },
  detailHeroId: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  detailBody: { padding: SPACING.lg },
  ticketBox: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md },
  ticketBoxLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  ticketBoxCode: { color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: 4, marginTop: 6 },
  ticketBoxHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  detailRowTotal: { borderBottomWidth: 0, marginTop: 4 },
  detailLabel: { color: COLORS.textSecondary, fontSize: 14 },
  detailValue: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  detailLabelTotal: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  detailValueTotal: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold' },
  closeBtn: { marginTop: SPACING.lg, paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  closeBtnText: { color: COLORS.textMuted, fontSize: 15 },
});
