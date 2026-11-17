export const colors = {
  background: '#050711',
  backgroundRaised: '#0A1020',
  surface: '#101A2B',
  surfaceElevated: '#15243A',
  glass: 'rgba(19, 31, 52, 0.82)',
  border: 'rgba(157, 190, 231, 0.20)',
  borderStrong: 'rgba(96, 210, 245, 0.42)',
  primary: '#56D9F5',
  primaryDeep: '#1686B8',
  gold: '#E7BD72',
  violet: '#9A8BFF',
  pink: '#F08BD8',
  text: '#F5F7FF',
  muted: '#9BAAC4',
  subtle: '#687994',
  danger: '#FF6B79',
  success: '#59D7A0',
  warning: '#F5C46B',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 44,
};

export const radii = {
  card: 22,
  panel: 18,
  control: 14,
  pill: 999,
};

export const shadows = {
  panel: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 4,
  },
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
