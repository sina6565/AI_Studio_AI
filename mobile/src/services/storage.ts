/**
 * Secure session storage.
 *
 * The session token is kept in the platform keychain (Android Keystore-backed
 * EncryptedSharedPreferences / iOS Keychain) rather than plain AsyncStorage, so
 * a filesystem dump on a rooted or jailbroken device does not expose it.
 */
import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.sinastudioai.session';

/** Persist the session token in secure platform storage. */
export async function saveSessionToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('session', token, { service: SERVICE });
}

/** Read the persisted session token, or null when none is stored. */
export async function loadSessionToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: SERVICE });
    return credentials ? credentials.password : null;
  } catch {
    // A locked/unavailable keystore should not crash startup; treat as signed out.
    return null;
  }
}

/** Remove the persisted session token. */
export async function clearSessionToken(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch {
    // Best-effort cleanup: a missing entry is not an error.
  }
}
