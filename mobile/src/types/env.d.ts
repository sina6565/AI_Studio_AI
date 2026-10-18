/**
 * Type declarations for build-time environment variables injected by
 * react-native-dotenv through the `@env` module.
 */
declare module '@env' {
  export const API_URL: string | undefined;
  export const ENVIRONMENT: string | undefined;
}
