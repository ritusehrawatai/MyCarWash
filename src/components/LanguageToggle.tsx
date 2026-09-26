import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';

interface LanguageToggleProps {
  variant?: 'segmented' | 'compact' | 'pill';
  className?: string;
  showLabels?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'segmented',
  className = '',
  showLabels = false,
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500 select-none ${
          language === 'es'
            ? 'bg-blue-600/10 text-blue-700 dark:text-cyan-300 border-blue-300 dark:border-blue-800'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs'
        } ${className}`}
        aria-label={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
        title={language === 'en' ? 'Switch to Español' : 'Cambiar a English'}
      >
        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
        <span className="font-mono uppercase">{language === 'en' ? 'EN' : 'ES'}</span>
        <span className="text-[10px] text-slate-400 font-normal">/ {language === 'en' ? 'ES' : 'EN'}</span>
      </button>
    );
  }

  // Segmented control: '🌐 EN | ES' or 'English | Español'
  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center p-1 rounded-xl border transition-colors select-none bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 shadow-xs ${className}`}
    >
      <div className="flex items-center pl-1.5 pr-1 text-slate-400 dark:text-slate-500">
        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
      </div>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
          language === 'en'
            ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-slate-700 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title="Switch to English"
      >
        <span>EN</span>
        {showLabels && <span className="hidden md:inline font-normal text-[11px]">English</span>}
      </button>

      <button
        type="button"
        onClick={() => setLanguage('es')}
        aria-pressed={language === 'es'}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
          language === 'es'
            ? 'bg-blue-600 text-white shadow-xs font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title="Cambiar a Español"
      >
        <span>ES</span>
        {showLabels && <span className="hidden md:inline font-normal text-[11px]">Español</span>}
      </button>
    </div>
  );
};
