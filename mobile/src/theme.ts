export const colors = {
  background: '#04060f',
  surface: '#0a1026',
  border: '#26334f',
  primary: '#22d3ee',
  text: '#f4f7ff',
  muted: '#9aa7c7',
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
