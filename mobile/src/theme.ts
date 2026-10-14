export const colors = {
  background: '#0f1115',
  surface: '#181b22',
  border: '#262a34',
  primary: '#6c5ce7',
  text: '#f5f6fa',
  muted: '#8b90a0',
  danger: '#e74c3c',
  success: '#2ecc71',
  warning: '#f1c40f',
};

export const spacing = {
  s: 8,
  m: 16,
  l: 24,
};

export function statusColor(status: string): string {
  switch (status) {
    case 'completed':
      return colors.success;
    case 'failed':
      return colors.danger;
    case 'processing':
      return colors.warning;
    case 'cancelled':
      return colors.muted;
    default:
      return colors.primary;
  }
}
