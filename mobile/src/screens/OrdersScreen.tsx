import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { getOrders } from '../services/api';
import { COLORS, SPACING, RADIUS } from '../types/theme';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Aguardando', color: COLORS.warning },
  confirmed: { label: 'Confirmado', color: COLORS.success },
  preparing: { label: 'Preparando', color: '#2196F3' },
  ready: { label: 'Pronto!', color: COLORS.success },
  delivered: { label: 'Entregue', color: COLORS.textSecondary },
  cancelled: { label: 'Cancelado', color: COLORS.error },
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.primary} />}
        renderItem={({ item }: any) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Pedido #{item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_MAP[item.status]?.color + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_MAP[item.status]?.color }]}>
                  {STATUS_MAP[item.status]?.label || item.status}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🎫 Ticket</Text>
              <Text style={styles.ticketCode}>{item.ticket_code}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>💰 Total</Text>
              <Text style={styles.totalValue}>R$ {Number(item.total).toFixed(2)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>💳 Pagamento</Text>
              <Text style={[styles.infoValue, { color: item.payment_status === 'approved' ? COLORS.success : COLORS.warning }]}>
                {item.payment_status === 'approved' ? 'Aprovado' : 'Pendente'}
              </Text>
            </View>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>Nenhum pedido encontrado.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  list: { padding: SPACING.md },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  infoLabel: { color: COLORS.textSecondary, fontSize: 13 },
  infoValue: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  ticketCode: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  totalValue: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold' },
  date: { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.sm },
  empty: { alignItems: 'center', marginTop: SPACING.xxl },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16, marginTop: SPACING.md },
});
