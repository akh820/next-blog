'use client';

import { useLanguage } from '@/contexts/LanguageContext';

import { useTranslation } from '@/hooks/useTranslation';

interface TranslatedTitleProps {
  title: string;
}

export default function TranslatedTitle({ title }: TranslatedTitleProps) {
  const { language } = useLanguage();

  const { translatedText, isLoading } = useTranslation(title, language);

  return (
    <h1 className="text-3xl font-bold md:text-4xl">
      {isLoading ? <span className="opacity-50">{title}</span> : translatedText}
    </h1>
  );
}
