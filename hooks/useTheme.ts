import { useCallback } from 'react';
import { Uniwind, useUniwind } from 'uniwind';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const { theme } = useUniwind();

  const setTheme = useCallback((newTheme: Theme) => {
    Uniwind.setTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    Uniwind.setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme]);

  const isDark = theme === 'dark';

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
}
