import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

export default function OrderSuccessScreen({ route, navigation }: any) {
  const { order } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const PAYMENT_LABEL: Record<string, string> = {
    pix: 'PIX 💠', credit_card: 'Crédito 💳',
    debit_card: 'Débito 💳', cash: 'Dinheiro 💵',
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Confete / Emoji animado */}
        <Animated.View style={[styles.emojiContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.mainEmoji}>🎉</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.title}>Pedido realizado!</Text>
          <Text style={styles.subtitle}>Sua pipoca está sendo preparada 🍿</Text>
        </Animated.View>

        {/* Luzes decorativas */}
        <View style={styles.lightsRow}>
          {[...Array(10)].map((_, i) => (
            <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
          ))}
        </View>

        {/* Card do Ticket */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketTop}>
            <Text style={styles.ticketLabel}>🎫 Código do Ticket</Text>
            <Text style={styles.ticketCode}>{order.ticket_code}</Text>
          </View>
          <View style={styles.ticketDivider}>
            <View style={styles.ticketCircleLeft} />
            <View style={styles.ticketDashedLine} />
            <View style={styles.ticketCircleRight} />
          </View>
          <View style={styles.ticketBottom}>
            <Text style={styles.ticketHint}>📲 Apresente este código na retirada</Text>
          </View>
        </View>

        {/* Info do pedido */}
        <View style={styles.infoCard}>
          {[
            { label: 'Número do pedido', value: `#${order.order_id}` },
            { label: 'Total pago', value: `R$ ${Number(order.total).toFixed(2)}`, valueStyle: { color: COLORS.gold, fontWeight: 'bold' as const } },
            { label: 'Forma de pagamento', value: PAYMENT_LABEL[order.payment_method] || order.payment_method },
            { label: 'Status', value: '⏳ Aguardando pagamento', valueStyle: { color: COLORS.warning } },
          ].map((row, i, arr) => (
            <View key={i} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={[styles.infoValue, row.valueStyle]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Passos */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>O que acontece agora?</Text>
          {[
            { icon: '✅', text: 'Pedido recebido pelo sistema' },
            { icon: '💳', text: 'Aguardando confirmação do pagamento' },
            { icon: '🍿', text: 'Pipoca sendo preparada' },
            { icon: '🎫', text: 'Apresente o ticket na retirada' },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepIcon, i === 0 && { backgroundColor: COLORS.primary + '33' }]}>
                <Text style={styles.stepEmoji}>{step.icon}</Text>
              </View>
              <Text style={[styles.stepText, i === 0 && { color: COLORS.text }]}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Botões */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Pedidos')}>
          <Text style={styles.primaryButtonText}>📋 Ver meus pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Sessoes')}>
          <Text style={styles.secondaryButtonText}>🎬 Ver sessões</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tertiaryButton} onPress={() => navigation.navigate('Cardapio')}>
          <Text style={styles.tertiaryButtonText}>Voltar ao cardápio</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, alignItems: 'center', paddingTop: SPACING.xxl },
  emojiContainer: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary, ...SHADOW.medium },
  mainEmoji: { fontSize: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.lg, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.xs, textAlign: 'center' },
  lightsRow: { flexDirection: 'row', gap: 8, marginVertical: SPACING.lg },
  light: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  lightGold: { backgroundColor: '#FFD700' },
  // Ticket estilo cinema
  ticketCard: { width: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.medium },
  ticketTop: { padding: SPACING.lg, alignItems: 'center' },
  ticketLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  ticketCode: { color: '#fff', fontSize: 34, fontWeight: 'bold', letterSpacing: 5, marginTop: SPACING.sm },
  ticketDivider: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -1 },
  ticketCircleLeft: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.background },
  ticketDashedLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  ticketCircleRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.background },
  ticketBottom: { padding: SPACING.md, alignItems: 'center' },
  ticketHint: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  // Info
  infoCard: { width: '100%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, marginTop: SPACING.md, borderWidth: 1, borderColor: '#2a2a2a' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  infoLabel: { color: COLORS.textSecondary, fontSize: 14 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  // Passos
  stepsCard: { width: '100%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md, borderWidth: 1, borderColor: '#2a2a2a' },
  stepsTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 1 },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  stepIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  stepEmoji: { fontSize: 18 },
  stepText: { color: COLORS.textMuted, fontSize: 14, flex: 1 },
  // Botões
  primaryButton: { width: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center', marginTop: SPACING.xl },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { width: '100%', borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary },
  secondaryButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: 'bold' },
  tertiaryButton: { paddingVertical: 12, marginTop: SPACING.sm, marginBottom: SPACING.xl },
  tertiaryButtonText: { color: COLORS.textMuted, fontSize: 14 },
});
