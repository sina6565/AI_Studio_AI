import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import type { Project } from '../types';
import { colors, spacing } from '../theme';
import { extractErrorMessage } from '../utils/errors';

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setProjects(await api.listProjects());
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const create = useCallback(async () => {
    if (!name.trim() || busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [name, description, busy, load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={projects}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
      }
      ListHeaderComponent={
        <View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder={t('projects.name')}
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder={t('projects.description')}
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity
            style={[styles.button, (!name.trim() || busy) && styles.buttonDisabled]}
            onPress={create}
            disabled={!name.trim() || busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>+ {t('projects.create')}</Text>
            )}
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={<Text style={styles.muted}>{t('projects.empty')}</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.rowTitle}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.muted}>{item.description}</Text>
          ) : null}
        </View>
      )}
    />
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
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    marginBottom: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 4,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginBottom: spacing.m,
    paddingVertical: spacing.m,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '600',
  },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: spacing.s,
    padding: spacing.m,
  },
  rowTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  muted: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.m,
  },
});
