import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'segmented' | 'compact' | 'pill';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'segmented',
  className = '',
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
          isDark
            ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
        } ${className}`}
        aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
        )}
      </button>
    );
  }

  // Segmented control: '☀️ Light | 🌙 Dark'
  return (
    <div
      role="group"
      aria-label="Theme selection"
      className={`inline-flex items-center p-1 rounded-xl border transition-colors select-none ${
        isDark
          ? 'bg-slate-800/90 border-slate-700/80 shadow-xs'
          : 'bg-slate-100 border-slate-200 shadow-xs'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={!isDark}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
          !isDark
            ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Activate Light Mode"
      >
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={isDark}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
          isDark
            ? 'bg-blue-600 text-white shadow-xs font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Activate Dark Mode"
      >
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-blue-100' : 'text-slate-500'}`} />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
};
