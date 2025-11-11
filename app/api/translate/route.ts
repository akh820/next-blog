import { NextRequest, NextResponse } from 'next/server';

import { Language } from '@/lib/types/language';

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

// DeepL 언어 코드 매핑

const DEEPL_LANG_MAP: Record<Language, string> = {
  ko: 'KO',

  en: 'EN',

  ja: 'JA',
};

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Text and targetLang are required' },

        { status: 400 }
      );
    }

    if (!DEEPL_API_KEY) {
      console.warn('DEEPL_API_KEY is not set. Translation skipped.');

      return NextResponse.json({ translatedText: text });
    }

    const targetLangCode = DEEPL_LANG_MAP[targetLang as Language];

    if (!targetLangCode) {
      return NextResponse.json(
        { error: 'Invalid target language' },

        { status: 400 }
      );
    }

    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',

        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      },

      body: new URLSearchParams({
        text,

        target_lang: targetLangCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.statusText}`);
    }

    const data = await response.json();

    const translatedText = data.translations[0].text;

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);

    return NextResponse.json(
      { error: 'Translation failed' },

      { status: 500 }
    );
  }
}
