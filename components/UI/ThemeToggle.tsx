'use client';

/**
 * ThemeToggle component
 * Dark/light mode toggle using next-themes.
 */

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 shadow-sm border border-gray-200 dark:border-white/10" />
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 shadow-sm border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all duration-150"
    >
      {isDark
        ? <Sun  className="w-4 h-4" />
        : <Moon className="w-4 h-4" />
      }
    </button>
  );
}
