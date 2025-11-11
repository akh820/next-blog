export type Language = 'ko' | 'en' | 'ja';

export const LANGUAGES = {
  ko: '한국어',

  en: 'English',

  ja: '日本語',
} as const;

export const GISCUS_LANG_MAP: Record<Language, string> = {
  ko: 'ko',

  en: 'en',

  ja: 'ja',
} as const;
