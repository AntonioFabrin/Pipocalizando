import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, TextInput
} from 'react-native';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

const PAYMENT_METHODS = [
  { id: 'pix', label: 'PIX', icon: '💠', desc: 'Aprovação imediata' },
  { id: 'credit_card', label: 'Crédito', icon: '💳', desc: 'Até 12x' },
  { id: 'debit_card', label: 'Débito', icon: '💳', desc: 'À vista' },
  { id: 'cash', label: 'Dinheiro', icon: '💵', desc: 'Na retirada' },
];

const CATEGORY_EMOJI: Record<string, string> = {
  'Pipoca': '🍿', 'Bebidas': '🥤', 'Combos': '🎬', 'Doces': '🍬',
};

export default function CartScreen({ navigation }: any) {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [notes, setNotes] = useState('');
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
        notes: notes || null,
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
        <Text style={styles.emptyText}>Adicione produtos do cardápio para continuar</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('Sessoes')}>
          <Text style={styles.ctaButtonText}>🎬 Ver sessões</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Cardapio')}>
          <Text style={styles.secondaryButtonText}>🍿 Ver cardápio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Carrinho</Text>
        <TouchableOpacity onPress={() => Alert.alert('Limpar carrinho', 'Remover todos os itens?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Limpar', style: 'destructive', onPress: clearCart }
        ])}>
          <Text style={styles.clearText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {/* Luzes */}
      <View style={styles.lightsRow}>
        {[...Array(10)].map((_, i) => (
          <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Itens */}
        <Text style={styles.sectionTitle}>Seus itens</Text>
        {items.map(item => (
          <View key={item.id} style={styles.item}>
            <View style={styles.itemEmoji}>
              <Text style={{ fontSize: 30 }}>🍿</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemPrice}>R$ {(item.price * item.quantity).toFixed(2)}</Text>
              <Text style={styles.itemUnit}>R$ {item.price.toFixed(2)} un.</Text>
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

        {/* Observações */}
        <Text style={styles.sectionTitle}>Observações</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Ex: sem sal, com manteiga extra..."
          placeholderTextColor={COLORS.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {/* Pagamento */}
        <Text style={styles.sectionTitle}>Forma de pagamento</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentOption, paymentMethod === method.id && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <Text style={styles.paymentIcon}>{method.icon}</Text>
              <Text style={[styles.paymentLabel, paymentMethod === method.id && styles.paymentLabelActive]}>{method.label}</Text>
              <Text style={styles.paymentDesc}>{method.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Resumo */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle} >Resumo</Text>
          {items.map(item => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={styles.summaryItem}>{item.name} x{item.quantity}</Text>
              <Text style={styles.summaryValue}>R$ {(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.checkoutText}>🎬 Finalizar pedido • R$ {total.toFixed(2)}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.xxl, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  clearText: { color: COLORS.error, fontSize: 14, fontWeight: '600' },
  lightsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: '#222' },
  light: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  lightGold: { backgroundColor: '#FFD700' },
  scroll: { padding: SPACING.md, paddingBottom: 120 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.md },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.small, borderWidth: 1, borderColor: '#2a2a2a' },
  itemEmoji: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', borderRadius: RADIUS.sm },
  itemInfo: { flex: 1, marginLeft: SPACING.md },
  itemName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  itemPrice: { fontSize: 15, color: COLORS.gold, fontWeight: 'bold', marginTop: 2 },
  itemUnit: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qBtn: { width: 32, height: 32, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  qBtnText: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', lineHeight: 22 },
  quantity: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  notesInput: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: '#333', textAlignVertical: 'top', minHeight: 70 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  paymentOption: { flex: 1, minWidth: '45%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 2, borderColor: COLORS.border },
  paymentOptionActive: { borderColor: COLORS.primary, backgroundColor: '#2a0005' },
  paymentIcon: { fontSize: 26 },
  paymentLabel: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, fontWeight: '700' },
  paymentLabelActive: { color: '#fff' },
  paymentDesc: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  summaryCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm, borderWidth: 1, borderColor: '#2a2a2a' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  summaryItem: { color: COLORS.textSecondary, fontSize: 13 },
  summaryValue: { color: COLORS.text, fontSize: 13 },
  summaryTotal: { borderBottomWidth: 0, marginTop: 4 },
  totalLabel: { fontSize: 16, color: COLORS.text, fontWeight: 'bold' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.gold },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  checkoutButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  checkoutButtonDisabled: { opacity: 0.6 },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.xl },
  emptyEmoji: { fontSize: 72 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
  ctaButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: SPACING.xl, marginTop: SPACING.xl },
  ctaButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { marginTop: SPACING.md, paddingVertical: 10 },
  secondaryButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});
