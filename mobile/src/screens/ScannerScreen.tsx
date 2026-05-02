import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Vibration
} from 'react-native';
import { validateTicket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

const STATUS_MAP: Record<string, string> = {
  pending: 'Aguardando pagamento',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto para retirada',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'PIX', credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito', cash: 'Dinheiro',
};

export default function ScannerScreen() {
  const { user } = useAuth();
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const inputRef = useRef<TextInput>(null);

  const handleValidate = async (code?: string) => {
    const codeToValidate = (code || ticketCode).trim().toUpperCase();
    if (!codeToValidate) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await validateTicket(codeToValidate);
      setResult({ success: true, data: response.data });
      Vibration.vibrate(200);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ticket inválido ou não encontrado.';
      setResult({ success: false, message: msg });
      Vibration.vibrate([0, 200, 100, 200]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTicketCode('');
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🎫 Validar Ticket</Text>
          <Text style={styles.headerSub}>Olá, {user?.name?.split(' ')[0]}!</Text>
        </View>
      </View>

      {/* Luzes */}
      <View style={styles.lightsRow}>
        {[...Array(10)].map((_, i) => (
          <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Painel de leitura */}
        {!result && (
          <View style={styles.scannerPanel}>
            <View style={styles.scannerFrame}>
              <View style={styles.scannerCorner} />
              <Text style={styles.scannerEmoji}>🎫</Text>
              <Text style={styles.scannerHint}>Digite o código abaixo</Text>
            </View>
          </View>
        )}

        {/* Input */}
        {!result && (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Código do Ticket</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="POP-XXXXXXXX"
              placeholderTextColor={COLORS.textMuted}
              value={ticketCode}
              onChangeText={t => setTicketCode(t.toUpperCase())}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={() => handleValidate()}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.validateButton, (!ticketCode.trim() || loading) && styles.validateButtonDisabled]}
              onPress={() => handleValidate()}
              disabled={!ticketCode.trim() || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.validateButtonText}>✅ Validar Ticket</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Resultado — Sucesso */}
        {result?.success && (
          <View style={styles.resultSuccess}>
            <View style={styles.resultHero}>
              <Text style={styles.resultEmoji}>✅</Text>
              <Text style={styles.resultTitle}>Ticket Válido!</Text>
              <Text style={styles.resultCode}>{result.data.ticket.ticket_code}</Text>
            </View>

            <View style={styles.resultInfo}>
              {[
                { label: '👤 Cliente',          value: result.data.ticket.customer_name },
                { label: '💰 Total',             value: `R$ ${Number(result.data.ticket.total).toFixed(2)}` },
                { label: '💳 Pagamento',         value: PAYMENT_LABEL[result.data.ticket.payment_method] || result.data.ticket.payment_method },
                { label: '📋 Status do pedido',  value: STATUS_MAP[result.data.ticket.status] || result.data.ticket.status },
                { label: '📅 Data do pedido',    value: new Date(result.data.ticket.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
              ].map((row, i, arr) => (
                <View key={i} style={[styles.resultRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.resultLabel}>{row.label}</Text>
                  <Text style={styles.resultValue}>{row.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.usedBadge}>
              <Text style={styles.usedBadgeText}>🎬 Ticket marcado como utilizado</Text>
            </View>

            <TouchableOpacity style={styles.newValidationBtn} onPress={handleClear}>
              <Text style={styles.newValidationText}>Validar outro ticket</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resultado — Erro */}
        {result && !result.success && (
          <View style={styles.resultError}>
            <View style={styles.resultHeroError}>
              <Text style={styles.resultEmoji}>❌</Text>
              <Text style={styles.resultTitleError}>Ticket Inválido</Text>
              <Text style={styles.resultErrorMessage}>{result.message}</Text>
            </View>

            <View style={styles.errorTips}>
              <Text style={styles.errorTipsTitle}>Possíveis causas:</Text>
              <Text style={styles.errorTip}>• Código digitado incorretamente</Text>
              <Text style={styles.errorTip}>• Ticket já foi utilizado</Text>
              <Text style={styles.errorTip}>• Ticket cancelado ou inválido</Text>
            </View>

            <TouchableOpacity style={styles.tryAgainBtn} onPress={handleClear}>
              <Text style={styles.tryAgainText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingTop: SPACING.xxl, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  lightsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: '#222' },
  light: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  lightGold: { backgroundColor: '#FFD700' },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  // Scanner frame
  scannerPanel: { alignItems: 'center', marginBottom: SPACING.lg },
  scannerFrame: { width: 220, height: 160, borderRadius: RADIUS.lg, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary, ...SHADOW.medium, position: 'relative' },
  scannerCorner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: RADIUS.lg, borderWidth: 3, borderColor: COLORS.primary + '66' },
  scannerEmoji: { fontSize: 64 },
  scannerHint: { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.sm },
  // Input
  inputCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: '#2a2a2a' },
  inputLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm, fontWeight: '600' },
  input: { backgroundColor: '#111', borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: 22, fontWeight: 'bold', letterSpacing: 3, borderWidth: 1, borderColor: '#333', textAlign: 'center' },
  validateButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.md },
  validateButtonDisabled: { backgroundColor: '#4a0005', opacity: 0.5 },
  validateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // Sucesso
  resultSuccess: { borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.success },
  resultHero: { backgroundColor: COLORS.success + '22', padding: SPACING.lg, alignItems: 'center' },
  resultEmoji: { fontSize: 60 },
  resultTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.success, marginTop: SPACING.sm },
  resultCode: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', letterSpacing: 3, marginTop: 4 },
  resultInfo: { backgroundColor: COLORS.card, padding: SPACING.md },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  resultLabel: { color: COLORS.textSecondary, fontSize: 13 },
  resultValue: { color: COLORS.text, fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  usedBadge: { backgroundColor: COLORS.success + '22', padding: SPACING.md, alignItems: 'center' },
  usedBadgeText: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
  newValidationBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, alignItems: 'center' },
  newValidationText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  // Erro
  resultError: { borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.error },
  resultHeroError: { backgroundColor: COLORS.error + '22', padding: SPACING.lg, alignItems: 'center' },
  resultTitleError: { fontSize: 22, fontWeight: 'bold', color: COLORS.error, marginTop: SPACING.sm },
  resultErrorMessage: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.sm, textAlign: 'center' },
  errorTips: { backgroundColor: COLORS.card, padding: SPACING.lg },
  errorTipsTitle: { color: COLORS.textSecondary, fontSize: 13, fontWeight: 'bold', marginBottom: SPACING.sm },
  errorTip: { color: COLORS.textMuted, fontSize: 13, marginBottom: 4 },
  tryAgainBtn: { backgroundColor: COLORS.error, padding: SPACING.md, alignItems: 'center' },
  tryAgainText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
