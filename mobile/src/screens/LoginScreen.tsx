import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../types/theme';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    console.log('🔵 [LOGIN 1] Botão pressionado');
    setErrorMsg('');

    if (!email || !password) {
      console.log('🔴 [LOGIN 2] Campos vazios');
      setErrorMsg('Preencha email e senha.');
      return;
    }

    console.log('🔵 [LOGIN 3] Campos preenchidos, email:', email);
    setLoading(true);

    try {
      console.log('🔵 [LOGIN 4] Chamando login na API...');
      await login(email, password);
      console.log('✅ [LOGIN 5] Login bem sucedido!');
    } catch (error: any) {
      console.log('🔴 [LOGIN 6] Erro capturado:', JSON.stringify(error?.message));
      console.log('🔴 [LOGIN 7] error.code:', error?.code);
      console.log('🔴 [LOGIN 8] error.response:', JSON.stringify(error?.response?.data));

      const msg =
        error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')
          ? 'Não foi possível conectar ao servidor. Verifique sua conexão.'
          : error?.response?.data?.message || 'Email ou senha inválidos.';
      setErrorMsg(msg);
    } finally {
      console.log('🔵 [LOGIN 9] Finally executado, setLoading false');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍿</Text>
          </View>
          <Text style={styles.logoText}>Pipocalizando</Text>
          <Text style={styles.logoSub}>A melhor pipoca do cinema!</Text>
        </View>

        {/* Luzes decorativas */}
        <View style={styles.lightsRow}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Entrar</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>📧 Email</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); setErrorMsg(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>🔒 Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={(t) => { setPassword(t); setErrorMsg(''); }}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.buttonInner}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>  Entrando...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>🎬 Entrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Criar nova conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={loading}
          >
            <Text style={styles.forgotButtonText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>🎥 Sua experiência de cinema começa aqui</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  logoContainer: { alignItems: 'center', marginBottom: SPACING.lg },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 3, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoEmoji: { fontSize: 52 },
  logoText: { fontSize: 34, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },
  logoSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  lightsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SPACING.lg },
  light: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  lightGold: { backgroundColor: '#FFD700' },
  form: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: '#333',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  errorBox: {
    backgroundColor: '#3B0000', borderRadius: RADIUS.sm, padding: SPACING.sm,
    marginBottom: SPACING.md, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  errorText: { color: '#FF6B6B', fontSize: 13 },
  inputWrapper: { marginBottom: SPACING.md },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: '#111', borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    color: COLORS.text, fontSize: 16, borderWidth: 1, borderColor: '#333',
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 15, alignItems: 'center', marginTop: SPACING.sm,
  },
  buttonDisabled: { backgroundColor: '#7a0008', opacity: 0.7 },
  buttonInner: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#333' },
  dividerText: { color: COLORS.textMuted, marginHorizontal: SPACING.sm, fontSize: 13 },
  secondaryButton: {
    borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary,
  },
  secondaryButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  forgotButton: { paddingVertical: 12, alignItems: 'center', marginTop: SPACING.sm },
  forgotButtonText: { color: COLORS.textMuted, fontSize: 14 },
  footer: { textAlign: 'center', color: COLORS.textMuted, fontSize: 13, marginTop: SPACING.lg },
});
