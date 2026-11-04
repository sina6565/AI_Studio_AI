import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

type WelcomeNavigation = {
  navigate: (screen: string) => void;
};

type Props = { navigation: WelcomeNavigation };

const WORLDS = [
  { en: 'Games', fa: 'بازی', color: '#22d3ee' },
  { en: 'Websites', fa: 'وب‌سایت', color: '#818cf8' },
  { en: 'Video', fa: 'ویدئو', color: '#e879f9' },
  { en: 'Audio', fa: 'صدا', color: '#fbbf24' },
  { en: 'Characters', fa: 'شخصیت', color: '#34d399' },
  { en: '3D Worlds', fa: 'جهان سه‌بعدی', color: '#60a5fa' },
];

export default function WelcomeScreen({ navigation }: Props) {
  const { i18n } = useTranslation();
  const isPersian = i18n.language.startsWith('fa');
  const copy = isPersian
    ? {
        eyebrow: 'سیستم‌عامل خلاقیت',
        headline: 'از یک ایده،',
        highlight: 'چندین جهان بساز.',
        body: 'بازی، وب‌سایت، ویدئو، صدا، شخصیت و جهان‌های سه‌بعدی؛ همه از یک نقطه شروع می‌شوند.',
        primary: 'ورود به استودیو',
        secondary: 'ساخت حساب کاربری',
        worlds: 'شش جهان خلاقیت',
        footer: 'یک ایده. جهان‌های بی‌نهایت.',
      }
    : {
        eyebrow: 'THE CREATIVE OPERATING SYSTEM',
        headline: 'ONE IDEA.',
        highlight: 'MULTIPLE WORLDS.',
        body: 'Create games, websites, video, audio, characters and 3D worlds — all from one place.',
        primary: 'ENTER THE STUDIO',
        secondary: 'CREATE AN ACCOUNT',
        worlds: 'SIX CREATIVE WORLDS',
        footer: 'FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE',
      };

  const switchLanguage = () => {
    void i18n.changeLanguage(isPersian ? 'en' : 'fa');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientBottom} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brandLockup}>
            <View style={styles.logoMark}><Text style={styles.logoLetter}>S</Text></View>
            <View>
              <Text style={styles.brandName}>SINA AI STUDIO</Text>
              <Text style={styles.brandCaption}>AI CREATIVE UNIVERSE</Text>
            </View>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={switchLanguage} style={styles.languageButton}>
            <Text style={styles.languageText}>{isPersian ? 'EN' : 'FA'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={styles.orbitStage}>
            <View style={styles.orbitOuter} />
            <View style={styles.orbitInner} />
            <View style={styles.coreGlow} />
            <View style={styles.core}><Text style={styles.coreLetter}>S</Text></View>
            <View style={[styles.orb, styles.orbOne]} />
            <View style={[styles.orb, styles.orbTwo]} />
            <View style={[styles.orb, styles.orbThree]} />
            <View style={[styles.orb, styles.orbFour]} />
            <View style={[styles.orb, styles.orbFive]} />
            <View style={[styles.orb, styles.orbSix]} />
          </View>

          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={[styles.headline, isPersian && styles.persianText]}>{copy.headline}</Text>
          <Text style={[styles.highlight, isPersian && styles.persianText]}>{copy.highlight}</Text>
          <Text style={[styles.description, isPersian && styles.persianText]}>{copy.body}</Text>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.primaryButtonText}>{copy.primary}</Text>
            <Text style={styles.buttonArrow}>{isPersian ? '←' : '→'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.secondaryButtonText}>{copy.secondary}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.worldsSection}>
          <Text style={[styles.sectionLabel, isPersian && styles.persianText]}>{copy.worlds}</Text>
          <View style={styles.worldGrid}>
            {WORLDS.map((world) => (
              <View key={world.en} style={styles.worldCard}>
                <View style={[styles.worldDot, { backgroundColor: world.color }]} />
                <Text style={[styles.worldName, isPersian && styles.persianText]}>
                  {isPersian ? world.fa : world.en}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.footer}>{copy.footer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 38 },
  ambientTop: {
    position: 'absolute', top: -120, left: -80, width: 300, height: 300,
    borderRadius: 150, backgroundColor: '#123a68', opacity: 0.35,
  },
  ambientBottom: {
    position: 'absolute', bottom: 80, right: -110, width: 260, height: 260,
    borderRadius: 130, backgroundColor: '#46245f', opacity: 0.22,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 42, height: 42, borderRadius: 13, borderWidth: 1, borderColor: '#4b789d',
    backgroundColor: '#0b1d35', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22d3ee', shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  logoLetter: { color: '#f7d28a', fontSize: 27, fontWeight: '900' },
  brandName: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 1.1 },
  brandCaption: { color: colors.primary, fontSize: 8, fontWeight: '700', letterSpacing: 1.7, marginTop: 3 },
  languageButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  languageText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  hero: { alignItems: 'center', paddingTop: 14 },
  orbitStage: { height: 242, width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  orbitOuter: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    borderWidth: 1, borderColor: 'rgba(34,211,238,0.34)', transform: [{ rotate: '24deg' }],
  },
  orbitInner: {
    position: 'absolute', width: 166, height: 166, borderRadius: 83,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.42)', transform: [{ rotate: '-28deg' }],
  },
  coreGlow: {
    position: 'absolute', width: 128, height: 128, borderRadius: 64,
    backgroundColor: '#124d70', opacity: 0.45,
  },
  core: {
    width: 88, height: 88, borderRadius: 28, borderWidth: 1.5, borderColor: '#e7bd75',
    backgroundColor: '#111a2c', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22d3ee', shadowOpacity: 0.55, shadowRadius: 24, elevation: 12,
    transform: [{ rotate: '-8deg' }],
  },
  coreLetter: { color: '#f5d28d', fontSize: 58, fontWeight: '900' },
  orb: { position: 'absolute', width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: '#07101e' },
  orbOne: { top: 21, left: '48%', backgroundColor: '#22d3ee' },
  orbTwo: { top: 75, right: '13%', backgroundColor: '#818cf8' },
  orbThree: { bottom: 33, right: '25%', backgroundColor: '#e879f9' },
  orbFour: { bottom: 20, left: '47%', backgroundColor: '#fbbf24' },
  orbFive: { bottom: 76, left: '13%', backgroundColor: '#34d399' },
  orbSix: { top: 68, left: '24%', backgroundColor: '#60a5fa' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  headline: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -0.7, textAlign: 'center' },
  highlight: { color: '#e7bd75', fontSize: 29, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center', marginTop: 2 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 24, textAlign: 'center', marginTop: 16, maxWidth: 360 },
  persianText: { writingDirection: 'rtl', textAlign: 'center', letterSpacing: 0 },
  primaryButton: {
    width: '100%', marginTop: 24, paddingVertical: 16, paddingHorizontal: 18,
    borderRadius: 15, backgroundColor: '#0d7895', borderWidth: 1, borderColor: '#36d7e9',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.6 },
  buttonArrow: { color: '#fff', fontSize: 18, fontWeight: '900' },
  secondaryButton: { marginTop: 13, paddingVertical: 12, paddingHorizontal: 18 },
  secondaryButtonText: { color: '#c3d2ee', fontSize: 13, fontWeight: '700' },
  worldsSection: { marginTop: 30 },
  sectionLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginBottom: 13 },
  worldGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  worldCard: {
    width: '48%', minHeight: 54, paddingHorizontal: 12, paddingVertical: 12,
    borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: '#0a1225',
    flexDirection: 'row', alignItems: 'center', gap: 9,
  },
  worldDot: { width: 8, height: 8, borderRadius: 4 },
  worldName: { color: colors.text, fontSize: 12, fontWeight: '700', flexShrink: 1 },
  footer: { color: '#657594', fontSize: 9, fontWeight: '700', letterSpacing: 1.1, textAlign: 'center', marginTop: 30 },
});
