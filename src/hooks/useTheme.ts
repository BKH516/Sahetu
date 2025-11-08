import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'auto';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'auto';
  });

  const [isDark, setIsDark] = useState(false);

  
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let shouldBeDark = false;

    switch (newTheme) {
      case 'dark':
        shouldBeDark = true;
        break;
      case 'light':
        shouldBeDark = false;
        break;
      case 'auto':
        shouldBeDark = prefersDark;
        break;
    }

    setIsDark(shouldBeDark);

    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    
    localStorage.setItem('theme', newTheme);
    
    // Dispatch custom event to notify other pages/components about theme change
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme, isDark: shouldBeDark } }));
  }, []);

  
  const changeTheme = useCallback((newTheme: Theme) => {
    
    if (newTheme !== theme) {
      setTheme(newTheme);
      applyTheme(newTheme);
    }
  }, [theme, applyTheme]);

  
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    changeTheme(newTheme);
  }, [theme, changeTheme]);

  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  return {
    theme,
    isDark,
    changeTheme,
    toggleTheme
  };
}; 