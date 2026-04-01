// Theme tokens and common styles for the mobile app
// Import the file as: import theme from '../styles/theme';

export const colors = {
  primary: '#2D52A2',
  primaryLight: '#CDD4FF',
  success: '#2E7D32',
  danger: '#D32F2F',
  warning: '#F57C00',
  muted: '#9CA3AF',
  text: '#111827',
  textSecondary: '#555',
  background: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  surface: '#F9FAFB'
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const sizes = {
  headerHeight: 56,
  cardPadding: spacing.md,
  inputHeight: 48,
};

export const typography = {
  fontFamily: 'System',
  h1: 30,
  h2: 24,
  h3: 20,
  body: 16,
  small: 13,
  caption: 12,
  button: 14,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  }
};

export const common = {
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
    ...shadows.card,
  },
  smallCard: {
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  }
};

const theme = { colors, spacing, radii, sizes, typography, shadows, common };
export default theme;
