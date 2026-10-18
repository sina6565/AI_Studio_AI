import { Platform } from 'react-native';
import { API_URL, ENVIRONMENT } from '@env';

/**
 * Per-platform default for the backend API base URL.
 *
 * The Android emulator cannot reach the host through `localhost`; `10.0.2.2`
 * is the special alias for the host loopback interface. A physical device must
 * set `API_URL` in `.env` to the machine's LAN address, and a deployed backend
 * must be set the same way.
 */
const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
}) as string;

/**
 * Effective API base URL. `API_URL` from `.env` wins; otherwise the
 * platform-aware default is used.
 */
export const API_BASE_URL =
  typeof API_URL === 'string' && API_URL.trim().length > 0
    ? API_URL.trim()
    : DEFAULT_API_URL;

export const APP_ENVIRONMENT = ENVIRONMENT || 'development';
