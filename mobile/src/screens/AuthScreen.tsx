import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { extractErrorMessage } from '../utils/errors';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (!isRegister || username.trim().length > 0) &&
    !busy;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (isRegister) {
        await api.register(email.trim(), username.trim(), password);
      } else {
        await api.login(email.trim(), password);
      }
      signIn();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>{t('app.title')}</Text>
      <Text style={styles.subtitle}>{t('app.subtitle')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.email')}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {isRegister && (
        <TextInput
          style={styles.input}
          placeholder={t('auth.username')}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder={t('auth.password')}
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={submit}
        disabled={!canSubmit}
      >
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.buttonText}>
            {isRegister ? t('auth.register') : t('auth.login')}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setMode(isRegister ? 'login' : 'register');
          setError('');
        }}
      >
        <Text style={styles.switch}>
          {isRegister ? t('auth.haveAccount') : t('auth.needAccount')}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.l,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.s,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    marginBottom: spacing.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 4,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.m,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.m,
  },
  switch: {
    color: colors.primary,
    marginTop: spacing.m,
    textAlign: 'center',
  },
});
