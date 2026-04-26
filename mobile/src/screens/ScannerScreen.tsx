import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Vibration
} from 'react-native';
import { validateTicket } from '../services/api';
import { COLORS, SPACING, RADIUS } from '../types/theme';

export default function ScannerScreen() {
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleValidate = async (code?: string) => {
    const codeToValidate = code || ticketCode;
    if (!codeToValidate.trim()) {
      Alert.alert('Atenção', 'Digite ou escaneie o código do ticket.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await validateTicket(codeToValidate.trim().toUpperCase());
      setResult({ success: true, data: response.data });
      Vibration.vibrate(200);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ticket inválido.';
      setResult({ success: false, message: msg });
      Vibration.vibrate([0, 200, 100, 200]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTicketCode('');
    setResult(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🎫 Validar Ticket</Text>
      <Text style={styles.subtitle}>Digite o código do ticket para validar</Text>

      {/* Input manual */}
      <View style={styles.inputCard}>
        <Text style={styles.label}>Código do Ticket</Text>
        <TextInput
          style={styles.input}
          placeholder="POP-XXXXXXXX"
          placeholderTextColor={COLORS.textMuted}
          value={ticketCode}
          onChangeText={text => setTicketCode(text.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={() => handleValidate()}
        />
        <TouchableOpacity style={styles.validateButton} onPress={() => handleValidate()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.validateButtonText}>Validar Ticket</Text>}
        </TouchableOpacity>
      </View>

      {/* Resultado */}
      {result && (
        <View style={[styles.resultCard, { borderColor: result.success ? COLORS.success : COLORS.error }]}>
          {result.success ? (
            <>
              <Text style={styles.resultEmoji}>✅</Text>
              <Text style={[styles.resultTitle, { color: COLORS.success }]}>Ticket Válido!</Text>
              <View style={styles.resultInfo}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Cliente</Text>
                  <Text style={styles.resultValue}>{result.data.ticket.customer_name}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Código</Text>
                  <Text style={[styles.resultValue, { color: COLORS.primary }]}>{result.data.ticket.ticket_code}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Total</Text>
                  <Text style={[styles.resultValue, { color: COLORS.gold }]}>R$ {Number(result.data.ticket.total).toFixed(2)}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Status pedido</Text>
                  <Text style={styles.resultValue}>{result.data.ticket.status}</Text>
                </View>
              </View>
              <Text style={styles.resultSub}>Ticket marcado como utilizado ✓</Text>
            </>
          ) : (
            <>
              <Text style={styles.resultEmoji}>❌</Text>
              <Text style={[styles.resultTitle, { color: COLORS.error }]}>Ticket Inválido</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </>
          )}

          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Validar outro ticket</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING.xl },
  inputCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
  },
  validateButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  validateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg, borderWidth: 2, alignItems: 'center' },
  resultEmoji: { fontSize: 56 },
  resultTitle: { fontSize: 22, fontWeight: 'bold', marginTop: SPACING.sm },
  resultInfo: { width: '100%', marginTop: SPACING.md },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultLabel: { color: COLORS.textSecondary, fontSize: 14 },
  resultValue: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  resultSub: { color: COLORS.success, fontSize: 13, marginTop: SPACING.md },
  resultMessage: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.sm, textAlign: 'center' },
  clearButton: { marginTop: SPACING.lg, padding: SPACING.md },
  clearButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: 'bold' },
});
