import React, { createContext, useContext, useEffect, useState } from 'react';
import { en } from '../locales/en';
import { es } from '../locales/es';

export type Language = 'en' | 'es';

export const STORAGE_LANGUAGE_KEY = 'carwash_language';
export const LEGACY_STORAGE_LANGUAGE_KEY = 'language';

type TranslationObject = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatDate: (date: string | Date | number | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: string | Date | number | null | undefined) => string;
  formatDateTime: (date: string | Date | number | null | undefined) => string;
}

const dictionaries: Record<Language, TranslationObject> = {
  en,
  es,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_LANGUAGE_KEY) ||
        localStorage.getItem(LEGACY_STORAGE_LANGUAGE_KEY);
      if (saved === 'es' || saved === 'en') {
        return saved;
      }
    } catch {
      // Ignore
    }
    // English is the default language
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LANGUAGE_KEY, language);
      localStorage.setItem(LEGACY_STORAGE_LANGUAGE_KEY, language);
    } catch {
      // Ignore
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'es' : 'en'));
  };

  // Nested translation helper with parameter interpolation
  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let value: any = dictionaries[language];

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        value = undefined;
        break;
      }
    }

    // Fallback to English if key missing in current language
    if (typeof value !== 'string') {
      let fallbackValue: any = dictionaries.en;
      for (const key of keys) {
        if (fallbackValue && typeof fallbackValue === 'object' && key in fallbackValue) {
          fallbackValue = fallbackValue[key];
        } else {
          fallbackValue = undefined;
          break;
        }
      }
      value = typeof fallbackValue === 'string' ? fallbackValue : keys[keys.length - 1];
    }

    // Param replacement {count}, {name}, etc.
    if (params && typeof value === 'string') {
      return Object.entries(params).reduce((str, [k, v]) => {
        return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }, value);
    }

    return value;
  };

  const getLocaleTag = (lang: Language) => (lang === 'es' ? 'es-ES' : 'en-US');

  const formatDate = (
    dateInput: string | Date | number | null | undefined,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    if (!dateInput) return '—';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);
      return new Intl.DateTimeFormat(
        getLocaleTag(language),
        options || { month: 'short', day: 'numeric', year: 'numeric' }
      ).format(d);
    } catch {
      return String(dateInput);
    }
  };

  const formatTime = (dateInput: string | Date | number | null | undefined): string => {
    if (!dateInput) return '';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return '';
      return new Intl.DateTimeFormat(getLocaleTag(language), {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    } catch {
      return '';
    }
  };

  const formatDateTime = (dateInput: string | Date | number | null | undefined): string => {
    if (!dateInput) return '—';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);
      return new Intl.DateTimeFormat(getLocaleTag(language), {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    } catch {
      return String(dateInput);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        formatDate,
        formatTime,
        formatDateTime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
