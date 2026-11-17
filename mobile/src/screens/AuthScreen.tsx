import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { extractErrorMessage } from '../utils/errors';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';

export default function AuthScreen() {
  const { t, i18n } = useTranslation();
  const { signIn } = useAuth();
  const isPersian = i18n.language.startsWith('fa');
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
    if (!canSubmit) return;

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
      <View style={styles.languageRow}>
        <LanguageToggle />
      </View>
      <View style={styles.brandMark}>
        <Text style={styles.brandLetter}>S</Text>
      </View>
      <Text style={styles.title}>{t('app.title')}</Text>
      <Text style={[styles.subtitle, isPersian && styles.rtl]}>{t('app.subtitle')}</Text>

      <TextInput
        style={[styles.input, isPersian && styles.rtlInput]}
        placeholder={t('auth.email')}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />

      {isRegister && (
        <TextInput
          style={[styles.input, isPersian && styles.rtlInput]}
          placeholder={t('auth.username')}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoComplete="username"
          value={username}
          onChangeText={setUsername}
        />
      )}

      <TextInput
        style={[styles.input, isPersian && styles.rtlInput]}
        placeholder={t('auth.password')}
        placeholderTextColor={colors.muted}
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={submit}
        disabled={!canSubmit}
      >
        {busy ? (
          <ActivityIndicator color="#07101D" />
        ) : (
          <Text style={styles.buttonText}>
            {isRegister ? t('auth.register') : t('auth.login')}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          setMode(isRegister ? 'login' : 'register');
          setError('');
        }}
      >
        <Text style={[styles.switch, isPersian && styles.rtl]}>
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
  languageRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.s,
  },
  brandMark: {
    alignSelf: 'center',
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
    marginBottom: spacing.m,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    transform: [{ rotate: '-7deg' }],
  },
  brandLetter: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '900',
    textShadowColor: colors.accent,
    textShadowRadius: 12,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    borderRadius: 13,
    color: colors.text,
    marginBottom: spacing.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 4,
  },
  rtlInput: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 13,
    paddingVertical: spacing.m,
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#07101D',
    fontWeight: '800',
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.m,
  },
  switch: {
    color: colors.accent,
    marginTop: spacing.m,
    textAlign: 'center',
  },
  rtl: {
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});
