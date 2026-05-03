import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../types/theme';
import { forgotPassword as apiForgotPassword, verifyResetCode as apiVerifyCode, resetPassword as apiResetPassword } from '../services/api';

type Step = 'email' | 'code' | 'password' | 'done';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendCode = async () => {
    if (!email.trim()) { setErrorMsg('Digite seu email.'); return; }
    setLoading(true); setErrorMsg('');
    try {
      await apiForgotPassword(email);
      setStep('code');
    } catch (e: any) {
      if (e?.response?.status === 404) {
        Alert.alert(
          '⚠️ Endpoint não implementado',
          'O backend ainda não tem /auth/forgot-password.\nAdicione esse endpoint para essa tela funcionar.',
          [{ text: 'Ok' }]
        );
      } else {
        setErrorMsg(e?.response?.data?.message || 'Erro ao enviar código. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) { setErrorMsg('Digite o código recebido.'); return; }
    setLoading(true); setErrorMsg('');
    try {
      await apiVerifyCode(email, code);
      setStep('password');
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) { setErrorMsg('Digite a nova senha.'); return; }
    if (newPassword.length < 6) { setErrorMsg('A senha deve ter ao menos 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setErrorMsg('As senhas não coincidem.'); return; }
    setLoading(true); setErrorMsg('');
    try {
      await apiResetPassword(email, code, newPassword);
      setStep('done');
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ['email', 'code', 'password', 'done'];
  const stepIndex = STEPS.indexOf(step);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🔑</Text>
          </View>
          <Text style={styles.logoTitle}>Recuperar senha</Text>
          <Text style={styles.logoSub}>Pipocalizando</Text>
        </View>

        {/* Progresso */}
        <View style={styles.progressRow}>
          {['Email', 'Código', 'Nova senha'].map((label, i) => (
            <View key={i} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                i < stepIndex && styles.progressDotDone,
                i === stepIndex && step !== 'done' && styles.progressDotActive,
              ]}>
                <Text style={styles.progressDotText}>{i < stepIndex ? '✓' : `${i + 1}`}</Text>
              </View>
              <Text style={[styles.progressLabel, i === stepIndex && { color: COLORS.primary }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Formulário */}
        <View style={styles.form}>

          {/* Erro */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {/* Passo 1: Email */}
          {step === 'email' && (
            <>
              <Text style={styles.stepTitle}>Digite seu email</Text>
              <Text style={styles.stepDesc}>
                Enviaremos um código de verificação para o email cadastrado na sua conta.
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>📧 Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={t => { setEmail(t); setErrorMsg(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>📨 Enviar código</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* Passo 2: Código */}
          {step === 'code' && (
            <>
              <Text style={styles.stepTitle}>Código de verificação</Text>
              <Text style={styles.stepDesc}>
                Enviamos um código para {email}. Pode levar alguns minutos.
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>🔢 Código</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="000000"
                  placeholderTextColor={COLORS.textMuted}
                  value={code}
                  onChangeText={t => { setCode(t.replace(/\D/g, '')); setErrorMsg(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>✅ Verificar código</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.resendBtn} onPress={handleSendCode} disabled={loading}>
                <Text style={styles.resendText}>Reenviar código</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Passo 3: Nova senha */}
          {step === 'password' && (
            <>
              <Text style={styles.stepTitle}>Nova senha</Text>
              <Text style={styles.stepDesc}>Escolha uma senha segura com pelo menos 6 caracteres.</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>🔒 Nova senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={newPassword}
                  onChangeText={t => { setNewPassword(t); setErrorMsg(''); }}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>🔒 Confirmar senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={confirmPassword}
                  onChangeText={t => { setConfirmPassword(t); setErrorMsg(''); }}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>🔑 Redefinir senha</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* Passo 4: Concluído */}
          {step === 'done' && (
            <View style={styles.doneContainer}>
              <Text style={styles.doneEmoji}>🎉</Text>
              <Text style={styles.doneTitle}>Senha redefinida!</Text>
              <Text style={styles.doneDesc}>
                Sua senha foi alterada com sucesso. Faça login com a nova senha.
              </Text>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.buttonText}>🎬 Fazer login</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.lg, paddingTop: SPACING.xxl },
  backBtn: { marginBottom: SPACING.md },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  logoContainer: { alignItems: 'center', marginBottom: SPACING.xl },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.surface, borderWidth: 3, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
  },
  logoEmoji: { fontSize: 44 },
  logoTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  logoSub: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  // Progresso
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginBottom: SPACING.xl },
  progressStep: { alignItems: 'center', gap: 6 },
  progressDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#333',
    justifyContent: 'center', alignItems: 'center',
  },
  progressDotActive: { borderColor: COLORS.primary, backgroundColor: '#2a0005' },
  progressDotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  progressDotText: { color: COLORS.textMuted, fontSize: 12, fontWeight: 'bold' },
  progressLabel: { color: COLORS.textMuted, fontSize: 11 },
  // Form
  form: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: '#333',
  },
  errorBox: {
    backgroundColor: '#3B0000', borderRadius: RADIUS.sm, padding: SPACING.sm,
    marginBottom: SPACING.md, borderLeftWidth: 3, borderLeftColor: COLORS.error,
  },
  errorText: { color: '#FF6B6B', fontSize: 13 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  stepDesc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg, lineHeight: 20 },
  inputWrapper: { marginBottom: SPACING.md },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: '#111', borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    color: COLORS.text, fontSize: 16, borderWidth: 1, borderColor: '#333',
  },
  codeInput: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', letterSpacing: 10 },
  button: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 15, alignItems: 'center', marginTop: SPACING.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resendBtn: { paddingVertical: 12, alignItems: 'center' },
  resendText: { color: COLORS.primary, fontSize: 14 },
  // Done
  doneContainer: { alignItems: 'center', paddingVertical: SPACING.md },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md },
  doneDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginVertical: SPACING.md, lineHeight: 21 },
});
