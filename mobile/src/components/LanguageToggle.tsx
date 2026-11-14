import React, { useCallback } from 'react';
import {
  Alert,
  I18nManager,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveLanguage } from '../services/storage';
import { colors } from '../theme';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const isPersian = i18n.language.startsWith('fa');

  const switchLanguage = useCallback(async () => {
    const nextLanguage = isPersian ? 'en' : 'fa';
    try {
      await saveLanguage(nextLanguage);
      await i18n.changeLanguage(nextLanguage);

      const requiresRtlRestart = (nextLanguage === 'fa') !== I18nManager.isRTL;
      if (requiresRtlRestart) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(nextLanguage === 'fa');
        Alert.alert(t('language.restartTitle'), t('language.restartMessage'));
      }
    } catch {
      Alert.alert(t('language.errorTitle'), t('language.errorMessage'));
    }
  }, [i18n, isPersian, t]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={isPersian ? t('language.switchToEnglish') : t('language.switchToPersian')}
      onPress={switchLanguage}
      style={styles.button}
    >
      <Text style={styles.label}>{isPersian ? 'EN' : 'فا'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 42,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  label: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
