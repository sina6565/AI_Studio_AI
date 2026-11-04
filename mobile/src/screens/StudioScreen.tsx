import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import type { JobType } from '../types';
import { colors, spacing } from '../theme';
import { extractErrorMessage } from '../utils/errors';

const TYPES: JobType[] = ['image', 'video', 'audio', 'speech', 'game'];
const MAX_PROMPT_LENGTH = 1200;

export default function StudioScreen() {
  const { t, i18n } = useTranslation();
  const isPersian = i18n.language.startsWith('fa');
  const [type, setType] = useState<JobType>('image');
  const [gameMode, setGameMode] = useState<'create' | 'build'>('create');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdJobId, setCreatedJobId] = useState('');

  const canSubmit = prompt.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    setCreatedJobId('');
    try {
      const job = await api.generate(type, { prompt: prompt.trim() }, gameMode);
      setCreatedJobId(job.jobId);
      setPrompt('');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, isPersian && styles.rtl]}>{t('creation.studioEyebrow')}</Text>
          <Text style={[styles.title, isPersian && styles.rtl]}>{t('creation.studioTitle')}</Text>
          <Text style={[styles.subtitle, isPersian && styles.rtl]}>{t('creation.studioSubtitle')}</Text>
        </View>

        <Text style={[styles.label, isPersian && styles.rtl]}>{t('creation.whatToCreate')}</Text>
        <View style={styles.types}>
          {TYPES.map((option) => (
            <TouchableOpacity
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: type === option }}
              style={[styles.type, type === option && styles.typeActive]}
              onPress={() => setType(option)}
            >
              <Text style={[styles.typeText, type === option && styles.typeTextActive]}>
                {t(`creation.type_${option}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === 'game' && (
          <View style={styles.modePanel}>
            <Text style={[styles.label, isPersian && styles.rtl]}>{t('creation.gameModeLabel')}</Text>
            <View style={styles.types}>
              {(['create', 'build'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: gameMode === option }}
                  style={[styles.type, gameMode === option && styles.typeActive]}
                  onPress={() => setGameMode(option)}
                >
                  <Text style={[styles.typeText, gameMode === option && styles.typeTextActive]}>
                    {t(option === 'build' ? 'creation.gameModeBuild' : 'creation.gameModeCreate')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.promptHeader}>
          <Text style={[styles.label, isPersian && styles.rtl]}>{t('creation.promptLabel')}</Text>
          <Text style={styles.counter}>{prompt.length}/{MAX_PROMPT_LENGTH}</Text>
        </View>
        <TextInput
          style={[styles.input, isPersian && styles.rtlInput]}
          placeholder={t('creation.promptPlaceholder')}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={MAX_PROMPT_LENGTH}
          textAlignVertical="top"
          value={prompt}
          onChangeText={setPrompt}
          accessibilityLabel={t('creation.promptLabel')}
        />

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {createdJobId ? (
          <View style={styles.successPanel}>
            <Text style={styles.successTitle}>{t('creation.queued')}</Text>
            <Text selectable style={styles.jobId}>{createdJobId}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={submit}
          disabled={!canSubmit}
        >
          {busy ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>{t('creation.generate')}</Text>
          )}
        </TouchableOpacity>
        <Text style={[styles.footnote, isPersian && styles.rtl]}>{t('creation.queueFootnote')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.m, paddingBottom: 36 },
  hero: {
    backgroundColor: '#0b1930',
    borderColor: '#23415d',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.l,
    padding: spacing.m,
  },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: spacing.s },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: spacing.s },
  label: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: spacing.s },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  rtlInput: { writingDirection: 'rtl', textAlign: 'right' },
  types: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.m },
  type: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: spacing.s,
    marginBottom: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 2,
  },
  typeActive: { backgroundColor: '#0b536a', borderColor: colors.primary },
  typeText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  typeTextActive: { color: colors.text },
  modePanel: {
    backgroundColor: '#080e1d',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.s,
    padding: spacing.m,
  },
  promptHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  counter: { color: colors.muted, fontSize: 11, marginBottom: spacing.s },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    minHeight: 150,
    marginBottom: spacing.m,
    padding: spacing.m,
    fontSize: 15,
    lineHeight: 23,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#087c98',
    borderColor: '#36d7e9',
    borderRadius: 13,
    borderWidth: 1,
    paddingVertical: spacing.m,
  },
  buttonDisabled: { opacity: 0.48 },
  buttonText: { color: colors.text, fontSize: 14, fontWeight: '900' },
  error: { color: colors.danger, marginBottom: spacing.m },
  successPanel: {
    backgroundColor: '#0b251f',
    borderColor: '#276b53',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.m,
    padding: spacing.m,
  },
  successTitle: { color: colors.success, fontWeight: '800', marginBottom: 5 },
  jobId: { color: colors.text, fontSize: 11 },
  footnote: { color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: spacing.m },
});
