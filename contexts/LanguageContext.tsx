'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import { Language } from '@/lib/types/language';

interface LanguageContextType {
  language: Language;

  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko');

  const [mounted, setMounted] = useState(false);

  // 클라이언트 사이드에서만 localStorage 읽기

  useEffect(() => {
    setMounted(true);

    const savedLang = localStorage.getItem('language') as Language;

    if (savedLang && ['ko', 'en', 'ja'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);

    localStorage.setItem('language', lang);
  };

  // 마운트되기 전에는 기본값 렌더링

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: 'ko', setLanguage }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}
