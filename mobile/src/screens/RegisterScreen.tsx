import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../types/theme';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    setErrorMsg('');
    if (!name || !email || !phone || !password || !confirmPassword) {
      setErrorMsg('Preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, phone, password });
      Alert.alert('🎉 Conta criada!', 'Cadastro realizado com sucesso. Faça login para continuar.', [
        { text: 'Entrar agora', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error: any) {
      const msg =
        error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')
          ? 'Não foi possível conectar ao servidor. Verifique sua conexão.'
          : error?.response?.data?.message || 'Erro ao criar conta.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: '👤 Nome completo', value: name, set: setName, placeholder: 'Seu nome completo', type: 'default', secure: false },
    { label: '📧 Email', value: email, set: setEmail, placeholder: 'seu@email.com', type: 'email-address', secure: false },
    { label: '📱 Telefone', value: phone, set: setPhone, placeholder: '(43) 99999-9999', type: 'phone-pad', secure: false },
    { label: '🔒 Senha', value: password, set: setPassword, placeholder: '••••••••', type: 'default', secure: true },
    { label: '🔒 Confirmar senha', value: confirmPassword, set: setConfirmPassword, placeholder: '••••••••', type: 'default', secure: true },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍿</Text>
          </View>
          <Text style={styles.logoText}>Pipocalizando</Text>
          <Text style={styles.logoSub}>Crie sua conta e comece a pedir!</Text>
        </View>

        {/* Luzes decorativas */}
        <View style={styles.lightsRow}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Criar Conta</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {fields.map((field, i) => (
            <View style={styles.inputWrapper} key={i}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.textMuted}
                value={field.value}
                onChangeText={(t) => { field.set(t); setErrorMsg(''); }}
                keyboardType={field.type as any}
                secureTextEntry={field.secure}
                autoCapitalize={field.type === 'email-address' ? 'none' : field.type === 'default' && !field.secure ? 'words' : 'none'}
                editable={!loading}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.buttonInner}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>  Criando conta...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>🎬 Criar conta</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>🎥 Sua experiência de cinema começa aqui</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.lg },

  header: { paddingTop: SPACING.md, marginBottom: SPACING.md },
  backButton: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },

  logoContainer: { alignItems: 'center', marginBottom: SPACING.md },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 3, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logoEmoji: { fontSize: 40 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },
  logoSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },

  lightsRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, marginBottom: SPACING.md,
  },
  light: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  lightGold: { backgroundColor: '#FFD700' },

  form: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },

  errorBox: {
    backgroundColor: '#3B0000',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  errorText: { color: '#FF6B6B', fontSize: 13 },

  inputWrapper: { marginBottom: SPACING.md },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: '#111',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },

  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonDisabled: { backgroundColor: '#7a0008', opacity: 0.7 },
  buttonInner: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#333' },
  dividerText: { color: COLORS.textMuted, marginHorizontal: SPACING.sm, fontSize: 13 },

  secondaryButton: {
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },

  footer: {
    textAlign: 'center', color: COLORS.textMuted,
    fontSize: 13, marginTop: SPACING.lg, marginBottom: SPACING.md,
  },
});
