import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import type { Job, JobStats } from '../types';
import { colors, spacing, statusColor } from '../theme';
import { extractErrorMessage } from '../utils/errors';
import { useAuth } from '../context/AuthContext';

const EMPTY_STATS: JobStats = {
  total: 0,
  queued: 0,
  processing: 0,
  completed: 0,
  failed: 0,
};

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [stats, setStats] = useState<JobStats>(EMPTY_STATS);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [statsResult, jobsResult] = await Promise.all([
        api.getJobStats(),
        api.listJobs(),
      ]);
      setStats(statsResult);
      setJobs(jobsResult);
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const cards: Array<{ key: string; label: string; value: number; color: string }> = [
    { key: 'total', label: t('jobs.total'), value: stats.total, color: colors.primary },
    { key: 'completed', label: t('jobs.completed'), value: stats.completed, color: colors.success },
    { key: 'processing', label: t('jobs.processing'), value: stats.processing, color: colors.warning },
    { key: 'failed', label: t('jobs.failed'), value: stats.failed, color: colors.danger },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
      }
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('app.title')}</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>{t('auth.signOut')}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.key} style={styles.card}>
            <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t('jobs.recent')}</Text>

      {jobs.length === 0 ? (
        <Text style={styles.muted}>{t('jobs.empty')}</Text>
      ) : (
        jobs.slice(0, 5).map((job) => (
          <View key={job.id} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{job.type}</Text>
              <Text style={styles.muted}>
                {new Date(job.createdAt).toLocaleString()}
              </Text>
            </View>
            <Text style={[styles.status, { color: statusColor(job.status) }]}>
              {job.status}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.m,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.m,
    padding: spacing.m,
    width: '48%',
  },
  cardValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  cardLabel: {
    color: colors.muted,
    marginTop: spacing.s / 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.s,
    marginTop: spacing.s,
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
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  signOut: {
    color: colors.primary,
    fontWeight: '600',
  },
});
