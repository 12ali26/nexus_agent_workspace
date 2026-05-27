export function getThemeToken(name, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()

  return value || fallback
}

export function getChartTheme() {
  return {
    blue: getThemeToken('--accent-blue', '#4ea1ff'),
    blueDim: getThemeToken('--accent-blue-dim', '#4ea1ff22'),
    green: getThemeToken('--accent-green', '#3fb950'),
    orange: getThemeToken('--accent-orange', '#ff7b1c'),
    purple: getThemeToken('--accent-purple', '#bc8cff'),
    red: getThemeToken('--accent-red', '#f85149'),
    textPrimary: getThemeToken('--text-primary', '#e6edf3'),
    textSecondary: getThemeToken('--text-secondary', '#8b949e'),
  }
}
