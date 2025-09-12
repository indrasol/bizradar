import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'Light' | 'Dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isThemeToggleDisabled: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  disableThemeToggle?: boolean; // New prop to disable theme switching
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, disableThemeToggle = false }) => {
  const [theme, setThemeState] = useState<Theme>('Light');

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    if (disableThemeToggle) {
      // Force light theme for public pages
      document.documentElement.classList.remove('dark');
      return;
    }
    
    if (newTheme === 'Dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize theme from localStorage
  useEffect(() => {
    if (disableThemeToggle) {
      // Force light theme for public pages
      setThemeState('Light');
      applyTheme('Light');
      return;
    }
    
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'Light' || savedTheme === 'Dark')) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to Light theme
      setThemeState('Light');
      applyTheme('Light');
      localStorage.setItem('theme', 'Light');
    }
  }, [disableThemeToggle]);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, disableThemeToggle]);

  const toggleTheme = () => {
    if (disableThemeToggle) {
      return; // Disable theme toggle for public pages
    }
    
    const newTheme = theme === 'Light' ? 'Dark' : 'Light';
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    if (disableThemeToggle) {
      return; // Disable theme setting for public pages
    }
    
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
    isThemeToggleDisabled: disableThemeToggle,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
