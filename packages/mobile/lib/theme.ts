export const colors = {
  bg: '#0a0a0e',
  bgCard: '#13131a',
  bgElevated: '#1a1a24',
  border: '#2a2a38',
  accent: '#6c63ff',
  accentDim: 'rgba(108,99,255,0.15)',
  accentHover: '#7c73ff',
  success: '#22c55e',
  successDim: 'rgba(34,197,94,0.15)',
  warning: '#f59e0b',
  warningDim: 'rgba(245,158,11,0.15)',
  danger: '#ef4444',
  dangerDim: 'rgba(239,68,68,0.15)',
  textPrimary: '#f0f0f8',
  textSecondary: '#8888a8',
  textMuted: '#55556a',
  white: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 999,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.textPrimary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textSecondary },
  label: { fontSize: 11, fontWeight: '600' as const, color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' as const },
};
