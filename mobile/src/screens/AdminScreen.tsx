import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert
} from 'react-native';
import { getOrders, updateOrderStatus, getProducts, getAll } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../types/theme';

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Aguardando', color: COLORS.warning },
  confirmed: { label: 'Confirmado', color: '#2196F3' },
  preparing: { label: 'Preparando', color: '#FF9800' },
  ready: { label: 'Pronto!', color: COLORS.success },
  delivered: { label: 'Entregue', color: COLORS.textSecondary },
  cancelled: { label: 'Cancelado', color: COLORS.error },
};

export default function AdminScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'orders' | 'products'>('orders');

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      setOrders(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = (orderId: number, currentStatus: string) => {
    const options = STATUS_OPTIONS.filter(s => s !== currentStatus).map(s => ({
      text: STATUS_MAP[s].label,
      onPress: async () => {
        try {
          await updateOrderStatus(orderId, s);
          fetchOrders();
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível atualizar o status.');
        }
      }
    }));
    Alert.alert('Atualizar Status', 'Selecione o novo status:', [...options, { text: 'Cancelar', style: 'cancel' as const }]);
  };

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Painel Admin</Text>
          <Text style={styles.headerSub}>{user?.name} • {user?.role}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total pedidos', value: orders.length, icon: '📋' },
          { label: 'Aguardando', value: orders.filter((o: any) => o.status === 'pending').length, icon: '⏳' },
          { label: 'Prontos', value: orders.filter((o: any) => o.status === 'ready').length, icon: '✅' },
        ].map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Pedidos */}
      <Text style={styles.sectionTitle}>Pedidos recentes</Text>
      <FlatList
        data={orders}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.primary} />}
        renderItem={({ item }: any) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Pedido #{item.id}</Text>
              <TouchableOpacity
                style={[styles.statusBadge, { backgroundColor: STATUS_MAP[item.status]?.color + '33' }]}
                onPress={() => handleStatusChange(item.id, item.status)}
              >
                <Text style={[styles.statusText, { color: STATUS_MAP[item.status]?.color }]}>
                  {STATUS_MAP[item.status]?.label} ✏️
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.orderInfo}>
              <Text style={styles.orderCustomer}>👤 {item.customer_name}</Text>
              <Text style={styles.orderTicket}>🎫 {item.ticket_code}</Text>
              <Text style={styles.orderTotal}>💰 R$ {Number(item.total).toFixed(2)}</Text>
            </View>
            <Text style={styles.orderDate}>
              {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.xxl, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  logoutBtn: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  logoutText: { color: COLORS.error, fontSize: 14, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.xs },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  list: { padding: SPACING.md, paddingTop: 0 },
  orderCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  orderInfo: { marginTop: SPACING.sm, gap: 4 },
  orderCustomer: { color: COLORS.textSecondary, fontSize: 13 },
  orderTicket: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  orderTotal: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold' },
  orderDate: { color: COLORS.textMuted, fontSize: 11, marginTop: SPACING.sm },
  empty: { alignItems: 'center', marginTop: SPACING.xxl },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});
