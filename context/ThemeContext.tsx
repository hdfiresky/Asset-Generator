
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { flushSync } from 'react-dom';

/**
 * Defines the possible theme values.
 */
type Theme = 'light' | 'dark';

/**
 * Defines the shape of the Theme Context.
 */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * React context for providing theme information.
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * A provider component that wraps the application and manages the theme state.
 * It detects user preference from local storage or system settings and applies
 * the theme to the root HTML element.
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components to render.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for a saved theme in local storage first.
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    // If no saved theme, check the user's system preference.
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return userPrefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove the opposite theme class and add the current theme class.
    const oldTheme = theme === 'dark' ? 'light' : 'dark';
    root.classList.remove(oldTheme);
    root.classList.add(theme);

    // Save the user's choice to local storage for persistence.
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // @ts-ignore - `startViewTransition` is not in all TS lib versions yet
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * A custom hook for consuming the theme context easily.
 * @returns {ThemeContextType} The current theme and the function to toggle it.
 * @throws Will throw an error if used outside of a ThemeProvider.
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};