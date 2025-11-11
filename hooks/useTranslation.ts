'use client';

import { useState, useEffect } from 'react';

import { Language } from '@/lib/types/language';

interface TranslationCache {
  [key: string]: {
    [lang: string]: string;
  };
}

const CACHE_KEY = 'translation-cache';

const CACHE_VERSION = 'v1';

const CACHE_KEY_WITH_VERSION = `${CACHE_KEY}-${CACHE_VERSION}`;

// localStorage에서 캐시 가져오기

function getCache(): TranslationCache {
  if (typeof window === 'undefined') return {};

  try {
    const cached = localStorage.getItem(CACHE_KEY_WITH_VERSION);

    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

// localStorage에 캐시 저장

function setCache(cache: TranslationCache) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CACHE_KEY_WITH_VERSION, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save translation cache:', error);
  }
}

// 캐시 키 생성 (텍스트 해시)

function getCacheKey(text: string): string {
  // 간단한 해시 함수 (실제로는 더 복잡한 해시 사용 가능)

  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);

    hash = (hash << 5) - hash + char;

    hash = hash & hash;
  }

  return hash.toString();
}

export function useTranslation(
  originalText: string,

  currentLang: Language,

  sourceLang: Language = 'ko'
) {
  const [translatedText, setTranslatedText] = useState(originalText);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 원본 언어와 현재 언어가 같으면 번역 안함

    if (currentLang === sourceLang) {
      setTranslatedText(originalText);

      return;
    }

    const translateText = async () => {
      setIsLoading(true);

      setError(null);

      try {
        // 캐시 확인

        const cache = getCache();

        const cacheKey = getCacheKey(originalText);

        if (cache[cacheKey]?.[currentLang]) {
          setTranslatedText(cache[cacheKey][currentLang]);

          setIsLoading(false);

          return;
        }

        // API 호출

        const response = await fetch('/api/translate', {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            text: originalText,

            targetLang: currentLang,
          }),
        });

        if (!response.ok) {
          throw new Error('Translation failed');
        }

        const data = await response.json();

        const translated = data.translatedText;

        // 캐시 저장

        if (!cache[cacheKey]) {
          cache[cacheKey] = {};
        }

        cache[cacheKey][currentLang] = translated;

        setCache(cache);

        setTranslatedText(translated);
      } catch (err) {
        console.error('Translation error:', err);

        setError('번역 실패');

        setTranslatedText(originalText); // 실패 시 원본 텍스트 표시
      } finally {
        setIsLoading(false);
      }
    };

    translateText();
  }, [originalText, currentLang, sourceLang]);

  return { translatedText, isLoading, error };
}
