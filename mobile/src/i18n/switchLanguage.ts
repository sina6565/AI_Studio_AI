import { Alert, I18nManager } from 'react-native';
import i18n from './config';

export async function toggleAppLanguage(): Promise<void> {
  const nextLanguage = i18n.language.startsWith('fa') ? 'en' : 'fa';
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
}
