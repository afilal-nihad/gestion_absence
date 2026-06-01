import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      title={isDark ? t('theme.light') : t('theme.dark')}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? 'D' : 'L'}
      </span>
      <span>{isDark ? t('theme.dark') : t('theme.light')}</span>
    </button>
  );
}
