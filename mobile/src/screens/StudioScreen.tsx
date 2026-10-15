import React, { useState } from 'react';
import {
  ActivityIndicator,
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

export default function StudioScreen() {
  const { t } = useTranslation();
  const [type, setType] = useState<JobType>('image');
  const [gameMode, setGameMode] = useState<'create' | 'build'>('create');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdJobId, setCreatedJobId] = useState('');

  const canSubmit = prompt.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>{t('creation.whatToCreate')}</Text>

      <View style={styles.types}>
        {TYPES.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.type, type === option && styles.typeActive]}
            onPress={() => setType(option)}
          >
            <Text style={[styles.typeText, type === option && styles.typeTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {type === 'game' && (
        <View style={styles.types}>
          {(['create', 'build'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.type, gameMode === option && styles.typeActive]}
              onPress={() => setGameMode(option)}
            >
              <Text style={[styles.typeText, gameMode === option && styles.typeTextActive]}>
                {t(option === 'build' ? 'creation.gameModeBuild' : 'creation.gameModeCreate')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder={t('creation.promptPlaceholder')}
        placeholderTextColor={colors.muted}
        multiline
        value={prompt}
        onChangeText={setPrompt}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {createdJobId ? (
        <Text style={styles.success}>
          {t('creation.queued')} {createdJobId}
        </Text>
      ) : null}

      <TouchableOpacity
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.m,
  },
  label: {
    color: colors.muted,
    marginBottom: spacing.s,
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.m,
  },
  type: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: spacing.s,
    marginBottom: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  typeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    color: colors.muted,
    textTransform: 'capitalize',
  },
  typeTextActive: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    height: 130,
    marginBottom: spacing.m,
    padding: spacing.m,
    textAlignVertical: 'top',
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
  success: {
    color: colors.success,
    marginBottom: spacing.m,
  },
});
