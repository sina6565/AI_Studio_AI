import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import type { Job } from '../types';
import { colors, spacing, statusColor } from '../theme';
import { extractErrorMessage } from '../utils/errors';

const CANCELLABLE = ['queued', 'pending', 'processing'];

export default function JobsScreen() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setJobs(await api.listJobs());
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

  const cancel = useCallback(
    async (jobId: string) => {
      setCancelling(jobId);
      setError('');
      try {
        await api.cancelJob(jobId);
        await load();
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setCancelling(null);
      }
    },
    [load],
  );

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
      data={jobs}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
      }
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
      ListEmptyComponent={<Text style={styles.muted}>{t('jobs.empty')}</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={styles.rowTitle}>{item.type}</Text>
            <Text style={styles.muted}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
            {typeof item.progress === 'number' ? (
              <Text style={styles.muted}>
                {t('jobs.progress')}: {item.progress}%
              </Text>
            ) : null}
            {item.error?.message ? (
              <Text style={styles.errorText}>{item.error.message}</Text>
            ) : null}
          </View>

          <View style={styles.rowSide}>
            <Text style={[styles.status, { color: statusColor(item.status) }]}>
              {item.status}
            </Text>
            {CANCELLABLE.includes(item.status) ? (
              <TouchableOpacity
                style={styles.cancel}
                onPress={() => cancel(item.id)}
                disabled={cancelling === item.id}
              >
                {cancelling === item.id ? (
                  <ActivityIndicator color={colors.danger} size="small" />
                ) : (
                  <Text style={styles.cancelText}>{t('jobs.cancel')}</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
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
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
    padding: spacing.m,
  },
  rowMain: {
    flex: 1,
  },
  rowSide: {
    alignItems: 'flex-end',
  },
  rowTitle: {
    color: colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  status: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  muted: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.m,
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.s / 2,
  },
  cancel: {
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.s,
    paddingHorizontal: spacing.s + 2,
    paddingVertical: spacing.s / 2,
  },
  cancelText: {
    color: colors.danger,
  },
});
