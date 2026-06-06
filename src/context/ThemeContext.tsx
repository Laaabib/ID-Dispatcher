import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type AccentColor = 'default' | 'bd-army' | 'ocean' | 'crimson';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultAccent?: AccentColor;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorblind: boolean;
  setColorblind: (colorblind: boolean) => void;
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  colorblind: false,
  setColorblind: () => null,
  accentColor: 'default',
  setAccentColor: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultAccent = 'default',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  
  const [colorblind, setColorblind] = useState<boolean>(
    () => localStorage.getItem(`${storageKey}-colorblind`) === 'true'
  );

  const [accentColor, setAccentColor] = useState<AccentColor>(
    () => (localStorage.getItem(`${storageKey}-accent`) as AccentColor) || defaultAccent
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark', 'theme-bd-army', 'theme-ocean', 'theme-crimson', 'theme-default');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    if (colorblind) {
      root.classList.add('colorblind');
    } else {
      root.classList.remove('colorblind');
    }

    if (accentColor !== 'default') {
      root.classList.add(`theme-${accentColor}`);
    }
  }, [theme, colorblind, accentColor]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    colorblind,
    setColorblind: (cb: boolean) => {
      localStorage.setItem(`${storageKey}-colorblind`, String(cb));
      setColorblind(cb);
    },
    accentColor,
    setAccentColor: (accent: AccentColor) => {
      localStorage.setItem(`${storageKey}-accent`, accent);
      setAccentColor(accent);
    }
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
