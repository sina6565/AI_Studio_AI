/**
 * Secure local preferences and session storage.
 *
 * Session tokens and the selected locale are stored in separate platform
 * keychain entries. No credentials or private provider keys belong in the app.
 */
import * as Keychain from 'react-native-keychain';

const SESSION_SERVICE = 'com.sinastudioai.session';
const LANGUAGE_SERVICE = 'com.sinastudioai.language';

export type AppLanguage = 'en' | 'fa';

export async function saveSessionToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('session', token, { service: SESSION_SERVICE });
}

export async function loadSessionToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: SESSION_SERVICE });
    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
}

export async function clearSessionToken(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
  } catch {
    // Best-effort cleanup: a missing entry is not an error.
  }
}

export async function saveLanguage(language: AppLanguage): Promise<void> {
  await Keychain.setGenericPassword('language', language, { service: LANGUAGE_SERVICE });
}

export async function loadLanguage(): Promise<AppLanguage | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: LANGUAGE_SERVICE });
    return credentials?.password === 'fa' ? 'fa' : credentials?.password === 'en' ? 'en' : null;
  } catch {
    return null;
  }
}
