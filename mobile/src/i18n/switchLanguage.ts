import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, I18nManager } from 'react-native';
import i18n from './config';

export type AppLanguage = 'en' | 'fa';

const LANGUAGE_KEY = '@sina-ai-studio/language';

export async function getSavedLanguage(): Promise<AppLanguage | null> {
  try {
    const value = await AsyncStorage.getItem(LANGUAGE_KEY);
    return value === 'en' || value === 'fa' ? value : null;
  } catch {
    return null;
  }
}

export async function initializeAppLanguage(): Promise<void> {
  const language = (await getSavedLanguage()) ?? 'fa';
  await i18n.changeLanguage(language);

  const shouldUseRtl = language === 'fa';
  if (I18nManager.isRTL !== shouldUseRtl) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(shouldUseRtl);
    Alert.alert(
      language === 'fa' ? 'راه‌اندازی مجدد لازم است' : 'Restart required',
      language === 'fa'
        ? 'برای اعمال چیدمان راست‌به‌چپ، برنامه را یک بار ببندید و دوباره باز کنید.'
        : 'Close and reopen SINA AI STUDIO once to apply the left-to-right layout.',
    );
  }
}

export async function toggleAppLanguage(): Promise<void> {
  const nextLanguage: AppLanguage = i18n.language.startsWith('fa') ? 'en' : 'fa';
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage);
    await i18n.changeLanguage(nextLanguage);

    const shouldUseRtl = nextLanguage === 'fa';
    if (I18nManager.isRTL !== shouldUseRtl) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(shouldUseRtl);
      Alert.alert(
        nextLanguage === 'fa' ? 'راه‌اندازی مجدد لازم است' : 'Restart required',
        nextLanguage === 'fa'
          ? 'برای اعمال کامل چیدمان راست‌به‌چپ، برنامه را ببندید و دوباره باز کنید.'
          : 'Close and reopen SINA AI STUDIO to apply the complete left-to-right layout.',
      );
    }
  } catch {
    Alert.alert(
      i18n.language.startsWith('fa') ? 'تغییر زبان انجام نشد' : 'Language update failed',
      i18n.language.startsWith('fa')
        ? 'ذخیره تنظیم زبان ممکن نشد. دوباره تلاش کنید.'
        : 'The language preference could not be saved. Please try again.',
    );
  }
}
