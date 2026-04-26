import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

const PAYMENT_METHODS = [
  { id: 'pix', label: 'PIX', icon: '💠' },
  { id: 'credit_card', label: 'Crédito', icon: '💳' },
  { id: 'debit_card', label: 'Débito', icon: '💳' },
  { id: 'cash', label: 'Dinheiro', icon: '💵' },
];

export default function CartScreen({ navigation }: any) {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos antes de finalizar.');
      return;
    }
    setLoading(true);
    try {
      const response = await createOrder({
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        payment_method: paymentMethod,
      });
      clearCart();
      navigation.navigate('OrderSuccess', { order: response.data });
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.message || 'Erro ao finalizar pedido.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Carrinho vazio</Text>
        <Text style={styles.emptyText}>Adicione produtos para continuar</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>Ver cardápio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Seus itens</Text>

        {items.map(item => (
          <View key={item.id} style={styles.item}>
            <View style={styles.itemEmoji}>
              <Text style={{ fontSize: 32 }}>🍿</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>R$ {item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.quantityControl}>
              <TouchableOpacity style={styles.qBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                <Text style={styles.qBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                <Text style={styles.qBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Forma de pagamento</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentOption, paymentMethod === method.id && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <Text style={styles.paymentIcon}>{method.icon}</Text>
              <Text style={[styles.paymentLabel, paymentMethod === method.id && styles.paymentLabelActive]}>
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Rodapé */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutText}>Finalizar pedido</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: 150 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.xl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.sm },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md, marginTop: SPACING.md },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.small },
  itemEmoji: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.sm },
  itemInfo: { flex: 1, marginLeft: SPACING.md },
  itemName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  itemPrice: { fontSize: 14, color: COLORS.gold, marginTop: 2 },
  quantityControl: { flexDirection: 'row', alignItems: 'center' },
  qBtn: { width: 30, height: 30, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  qBtnText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  quantity: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginHorizontal: SPACING.sm },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  paymentOption: { flex: 1, minWidth: '45%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 2, borderColor: COLORS.border },
  paymentOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDark },
  paymentIcon: { fontSize: 24 },
  paymentLabel: { color: COLORS.textSecondary, fontSize: 13, marginTop: SPACING.xs, fontWeight: '600' },
  paymentLabelActive: { color: '#fff' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  totalLabel: { fontSize: 18, color: COLORS.textSecondary },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.gold },
  checkoutButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  button: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.xl, paddingHorizontal: SPACING.xl },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
