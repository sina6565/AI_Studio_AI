import type { AxiosError } from 'axios';

interface ApiErrorBody {
  error?: { code?: string; message?: string };
  message?: string;
}

/**
 * Extract a user-facing message from an unknown error thrown by the API client.
 */
export function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  const body = axiosError?.response?.data;
  return (
    body?.error?.message ||
    body?.message ||
    axiosError?.message ||
    'Unexpected error'
  );
}
