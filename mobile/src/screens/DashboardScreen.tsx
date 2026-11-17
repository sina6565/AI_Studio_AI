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
import { colors, radii, shadows, spacing, statusColor } from '../theme';
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
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const isPersian = i18n.language.startsWith('fa');
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
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingHalo}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
        <Text style={styles.loadingLabel}>SINA AI STUDIO</Text>
      </View>
    );
  }

  const cards: Array<{ key: string; label: string; value: number; color: string }> = [
    { key: 'total', label: t('jobs.total'), value: stats.total, color: colors.primary },
    { key: 'queued', label: t('jobs.queued'), value: stats.queued, color: colors.violet },
    { key: 'processing', label: t('jobs.processing'), value: stats.processing, color: colors.warning },
    { key: 'completed', label: t('jobs.completed'), value: stats.completed, color: colors.success },
    { key: 'failed', label: t('jobs.failed'), value: stats.failed, color: colors.danger },
  ];

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.ambientA} />
      <View pointerEvents="none" style={styles.ambientB} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
            <View>
              <Text style={styles.brandName}>SINA AI STUDIO</Text>
              <Text style={styles.brandCaption}>CREATIVE INTELLIGENCE UNIVERSE</Text>
            </View>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('auth.signOut')}
            onPress={signOut}
            style={styles.signOutButton}
          >
            <Text style={styles.signOut}>{t('auth.signOut')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopLine}>
            <View style={styles.liveDot} />
            <Text style={styles.heroEyebrow}>{isPersian ? 'مرکز فرماندهی خلاقیت' : 'CREATIVE COMMAND CENTER'}</Text>
            <Text style={styles.heroIndex}>S / 01</Text>
          </View>
          <Text style={[styles.heroTitle, isPersian && styles.rtlText]}>
            {isPersian ? 'ایده بعدی‌ات را به واقعیت تبدیل کن.' : 'Turn your next idea into reality.'}
          </Text>
          <Text style={[styles.heroDescription, isPersian && styles.rtlText]}>
            {isPersian
              ? 'تمام پروژه‌ها، خروجی‌ها و جریان‌های هوشمند تو در یک فضای واحد.'
              : 'Your projects, creations and intelligent workflows — in one universe.'}
          </Text>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterLabel}>{isPersian ? 'فعالیت‌های استودیو' : 'STUDIO ACTIVITY'}</Text>
            <View style={styles.heroFooterRule} />
            <Text style={styles.heroFooterValue}>{String(stats.total).padStart(2, '0')}</Text>
          </View>
          <View pointerEvents="none" style={styles.heroOrb} />
          <View pointerEvents="none" style={styles.heroOrbCore} />
        </View>

        {error ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>{isPersian ? 'اتصال برقرار نشد' : 'Connection interrupted'}</Text>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>{isPersian ? 'نمای کلی' : 'OVERVIEW'}</Text>
            <Text style={[styles.sectionTitle, isPersian && styles.rtlText]}>{isPersian ? 'وضعیت استودیو' : 'Studio pulse'}</Text>
          </View>
          <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>LIVE DATA</Text></View>
        </View>

        <View style={styles.grid}>
          {cards.map((card) => (
            <View key={card.key} style={styles.statCard}>
              <View style={[styles.statAccent, { backgroundColor: card.color }]} />
              <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
              <Text style={[styles.cardLabel, isPersian && styles.rtlText]}>{card.label}</Text>
              <View style={[styles.cardGlow, { backgroundColor: card.color }]} />
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>{isPersian ? 'آخرین رویدادها' : 'RECENT ACTIVITY'}</Text>
            <Text style={[styles.sectionTitle, isPersian && styles.rtlText]}>{t('jobs.recent')}</Text>
          </View>
          <View style={styles.activityCount}><Text style={styles.activityCountText}>{jobs.length}</Text></View>
        </View>

        {jobs.length === 0 ? (
          <View style={styles.emptyPanel}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>✦</Text></View>
            <Text style={styles.emptyTitle}>{t('jobs.empty')}</Text>
            <Text style={styles.emptyCaption}>
              {isPersian ? 'اولین پروژه خلاقانه‌ات را از بخش استودیو آغاز کن.' : 'Start your first creation from the Studio.'}
            </Text>
          </View>
        ) : (
          jobs.slice(0, 5).map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={[styles.jobStatusRail, { backgroundColor: statusColor(job.status) }]} />
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{job.type.replace(/_/g, ' ')}</Text>
                <Text style={styles.muted}>{new Date(job.createdAt).toLocaleString(isPersian ? 'fa-IR' : 'en-US')}</Text>
              </View>
              <View style={[styles.statusPill, { borderColor: statusColor(job.status) }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(job.status) }]} />
                <Text style={[styles.status, { color: statusColor(job.status) }]}>{job.status}</Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>SINA AI STUDIO</Text>
          <Text style={styles.footerTagline}>FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.m, paddingTop: spacing.m, paddingBottom: spacing.xxl },
  ambientA: { position: 'absolute', top: -120, right: -110, width: 260, height: 260, borderRadius: 130, backgroundColor: '#124A70', opacity: 0.22 },
  ambientB: { position: 'absolute', top: 360, left: -150, width: 260, height: 260, borderRadius: 130, backgroundColor: '#47316E', opacity: 0.16 },
  centered: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  loadingHalo: { alignItems: 'center', justifyContent: 'center', width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, ...shadows.glow },
  loadingLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginTop: spacing.m },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.l },
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  brandMark: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceElevated },
  brandMarkText: { color: colors.gold, fontSize: 25, fontWeight: '800' },
  brandName: { color: colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  brandCaption: { color: colors.subtle, fontSize: 7, fontWeight: '700', letterSpacing: 1.1, marginTop: 3 },
  signOutButton: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.glass },
  signOut: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  heroCard: { overflow: 'hidden', position: 'relative', minHeight: 218, padding: spacing.l, borderRadius: radii.card, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: '#101E34', marginBottom: spacing.xl, ...shadows.panel },
  heroTopLine: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  heroEyebrow: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  heroIndex: { color: colors.subtle, fontSize: 9, marginLeft: 'auto', letterSpacing: 1.2 },
  heroTitle: { color: colors.text, fontSize: 25, lineHeight: 34, fontWeight: '800', maxWidth: '88%', marginTop: spacing.l },
  heroDescription: { color: colors.muted, fontSize: 12, lineHeight: 20, maxWidth: '86%', marginTop: spacing.s },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  heroFooter: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.l, gap: 9 },
  heroFooterLabel: { color: colors.subtle, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  heroFooterRule: { flex: 1, height: 1, backgroundColor: colors.border },
  heroFooterValue: { color: colors.gold, fontSize: 12, fontWeight: '800' },
  heroOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: 'rgba(86,217,245,0.15)', right: -78, top: 24 },
  heroOrbCore: { position: 'absolute', width: 116, height: 116, borderRadius: 58, borderWidth: 1, borderColor: 'rgba(231,189,114,0.18)', right: -42, top: 61, backgroundColor: 'rgba(86,217,245,0.035)' },
  errorPanel: { borderRadius: radii.panel, borderWidth: 1, borderColor: 'rgba(255,107,121,0.32)', backgroundColor: 'rgba(72,25,39,0.38)', padding: spacing.m, marginBottom: spacing.l },
  errorTitle: { color: colors.danger, fontWeight: '700', marginBottom: 4 },
  error: { color: '#F5B8C0', fontSize: 12, lineHeight: 18 },
  sectionHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.m },
  sectionEyebrow: { color: colors.subtle, fontSize: 8, fontWeight: '800', letterSpacing: 1.7, marginBottom: 5 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionBadge: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.glass },
  sectionBadgeText: { color: colors.primary, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.xl },
  statCard: { overflow: 'hidden', position: 'relative', width: '48.3%', minHeight: 104, padding: spacing.m, borderRadius: radii.panel, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass, marginBottom: 10, ...shadows.panel },
  statAccent: { width: 22, height: 3, borderRadius: 2, marginBottom: 12 },
  cardValue: { fontSize: 27, fontWeight: '800' },
  cardLabel: { color: colors.muted, fontSize: 11, marginTop: 4 },
  cardGlow: { position: 'absolute', width: 54, height: 54, borderRadius: 27, opacity: 0.055, right: -12, bottom: -18 },
  activityCount: { alignItems: 'center', justifyContent: 'center', minWidth: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  activityCountText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  emptyPanel: { alignItems: 'center', borderRadius: radii.card, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: 'rgba(16,26,43,0.58)', padding: spacing.xl, marginTop: 2 },
  emptyIcon: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceElevated, marginBottom: spacing.m },
  emptyIconText: { color: colors.gold, fontSize: 23 },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  emptyCaption: { color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 18, marginTop: 7 },
  jobCard: { alignItems: 'center', flexDirection: 'row', overflow: 'hidden', minHeight: 76, borderRadius: radii.panel, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass, padding: spacing.m, marginBottom: spacing.s },
  jobStatusRail: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginRight: 12 },
  rowMain: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 12, fontWeight: '700', textTransform: 'capitalize', marginBottom: 5 },
  muted: { color: colors.subtle, fontSize: 10 },
  statusPill: { alignItems: 'center', flexDirection: 'row', gap: 5, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, marginLeft: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  status: { fontSize: 8, fontWeight: '800', textTransform: 'capitalize' },
  footer: { alignItems: 'center', paddingTop: spacing.xl, marginTop: spacing.l, borderTopWidth: 1, borderTopColor: colors.border },
  footerBrand: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  footerTagline: { color: colors.subtle, fontSize: 7, letterSpacing: 1.1, marginTop: 7, textAlign: 'center' },
});
