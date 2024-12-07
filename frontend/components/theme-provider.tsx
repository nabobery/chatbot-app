'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
  attribute: string;
  defaultTheme: string;
  enableSystem: boolean;
}

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  enableSystem: boolean
}

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export const ThemeProvider = ({ children, attribute, defaultTheme, enableSystem }: ThemeProviderProps) => {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute(attribute, theme);
  }, [theme, attribute]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, enableSystem }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};