export const colors = {
  accent: '#6366f1',
  accentDark: '#4f46e5',
  accentLight: '#818cf8',
  accentPurple: '#a855f7',
  accentDeep: '#7c3aed',
  income: '#10b981',
  incomeDark: '#059669',
  incomeLight: '#34d399',
  expense: '#ef4444',
  expenseLight: '#f87171',
  warning: '#f59e0b',
  warningDark: '#d97706',
  warningLight: '#fbbf24',
} as const

export const accountGradients = [
  `linear-gradient(135deg, ${colors.accent}, ${colors.accentLight})`,
  `linear-gradient(135deg, ${colors.income}, ${colors.incomeLight})`,
  `linear-gradient(135deg, ${colors.warning}, ${colors.warningLight})`,
  `linear-gradient(135deg, ${colors.expense}, ${colors.expenseLight})`,
] as const

export const accountColorList = [colors.accent, colors.income, colors.warning, colors.expense] as const

export const categoryPalette = [
  '#6366f1', '#f97316', '#10b981', '#ef4444', '#06b6d4',
  '#eab308', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e',
  '#3b82f6', '#84cc16', '#a855f7', '#f59e0b', '#0ea5e9',
  '#78716c',
] as const