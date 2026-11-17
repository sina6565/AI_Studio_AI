/**
 * SINA mobile design tokens: deep-space surfaces with restrained gold and cyan.
 */
export const colors = {
  background: '#050816',
  surface: '#0B1222',
  surfaceElevated: '#111D32',
  border: '#1B3553',
  primary: '#E8C36A',
  accent: '#48D9F2',
  text: '#F4F7FF',
  muted: '#91A2BD',
  danger: '#FF647C',
  success: '#58D6A0',
  warning: '#F4B95F',
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
      return colors.accent;
  }
}
