import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../types/theme';

export default function OrderSuccessScreen({ route, navigation }: any) {
  const { order } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Pedido realizado!</Text>
      <Text style={styles.subtitle}>Seu pedido foi criado com sucesso.</Text>

      <View style={styles.ticketCard}>
        <Text style={styles.ticketLabel}>🎫 Código do Ticket</Text>
        <Text style={styles.ticketCode}>{order.ticket_code}</Text>
        <Text style={styles.ticketInfo}>Apresente este código na retirada</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pedido #</Text>
          <Text style={styles.infoValue}>{order.order_id}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total</Text>
          <Text style={styles.infoValue}>R$ {Number(order.total).toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, { color: COLORS.warning }]}>Aguardando pagamento</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Orders')}>
        <Text style={styles.buttonText}>Ver meus pedidos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.buttonSecondaryText}>Voltar ao cardápio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emoji: { fontSize: 72 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.xs },
  ticketCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginTop: SPACING.xl, width: '100%' },
  ticketLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  ticketCode: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 4, marginTop: SPACING.sm },
  ticketInfo: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: SPACING.sm },
  infoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.lg, width: '100%', marginTop: SPACING.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { color: COLORS.textSecondary, fontSize: 14 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  button: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', width: '100%', marginTop: SPACING.xl },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonSecondary: { marginTop: SPACING.md, padding: SPACING.md, alignItems: 'center', width: '100%' },
  buttonSecondaryText: { color: COLORS.textSecondary, fontSize: 15 },
});
