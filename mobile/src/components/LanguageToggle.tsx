import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { toggleAppLanguage } from '../i18n/switchLanguage';
import { colors } from '../theme';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const isPersian = i18n.language.startsWith('fa');

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={isPersian ? 'تغییر زبان به انگلیسی' : 'Switch language to Persian'}
      accessibilityHint={isPersian ? 'English language' : 'Persian language'}
      onPress={() => { void toggleAppLanguage(); }}
      style={styles.button}
    >
      <Text style={styles.label}>{isPersian ? 'EN' : 'FA'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
