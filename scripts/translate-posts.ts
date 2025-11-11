import { getPublishedPosts } from '@/lib/notion';
import { Language } from '@/lib/types/language';
import { NotionToMarkdown } from 'notion-to-md';
import { notion } from '@/lib/notion';
import fs from 'fs/promises';
import path from 'path';

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

const DEEPL_LANG_MAP: Record<Language, string> = {
  ko: 'KO',
  en: 'EN',
  ja: 'JA',
};

interface TranslatedContent {
  [slug: string]: {
    [lang: string]: {
      title: string;
      description: string;
      markdown: string;
    };
  };
}

// 마크다운에서 번역하면 안 되는 부분을 보호하고 텍스트만 추출
function extractTranslatableText(markdown: string): {
  text: string;
  placeholders: Map<string, string>;
} {
  const placeholders = new Map<string, string>();
  let index = 0;

  const createPlaceholder = (content: string): string => {
    const placeholder = `__PLACEHOLDER_${index++}__`;
    placeholders.set(placeholder, content);
    return placeholder;
  };

  // 1. 코드 블록 보호 (```...```)
  let protectedText = markdown.replace(/```[\s\S]*?```/g, (match) => createPlaceholder(match));

  // 2. 인라인 코드 보호 (`...`)
  protectedText = protectedText.replace(/`[^`]+`/g, (match) => createPlaceholder(match));

  // 3. 이미지 보호 (![alt](url))
  protectedText = protectedText.replace(/!\[([^\]]*)\]\([^)]+\)/g, (match) =>
    createPlaceholder(match)
  );

  // 4. 링크 URL 보호하되 텍스트는 번역 ([text](url) -> [text](__PLACEHOLDER__))
  protectedText = protectedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
    const urlPlaceholder = createPlaceholder(url);
    return `[${text}](${urlPlaceholder})`;
  });

  // 5. HTML 태그 보호
  protectedText = protectedText.replace(/<[^>]+>/g, (match) => createPlaceholder(match));

  return { text: protectedText, placeholders };
}

// 번역된 텍스트에 원본 콘텐츠 복원
function restoreProtectedContent(
  translatedText: string,
  placeholders: Map<string, string>
): string {
  let restored = translatedText;
  placeholders.forEach((original, placeholder) => {
    restored = restored.replace(new RegExp(placeholder, 'g'), original);
  });
  return restored;
}

async function translateText(text: string, targetLang: Language): Promise<string> {
  if (!DEEPL_API_KEY) {
    console.warn('DEEPL_API_KEY is not set. Returning original text.');
    return text;
  }

  const targetLangCode = DEEPL_LANG_MAP[targetLang];
  if (!targetLangCode) {
    throw new Error(`Invalid target language: ${targetLang}`);
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
      tag_handling: 'xml', // XML 태그 형식 유지
      preserve_formatting: '1', // 포맷 유지
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.translations[0].text;
}

// 마크다운 전체를 안전하게 번역
async function translateMarkdown(markdown: string, targetLang: Language): Promise<string> {
  const { text: protectedText, placeholders } = extractTranslatableText(markdown);
  const translatedText = await translateText(protectedText, targetLang);
  return restoreProtectedContent(translatedText, placeholders);
}

async function translatePosts() {
  console.log('🌐 Starting translation process...');

  const { posts } = await getPublishedPosts({ pageSize: 100 });
  const languages: Language[] = ['en', 'ja']; // ko는 원본이므로 제외
  const translatedContent: TranslatedContent = {};
  const n2m = new NotionToMarkdown({ notionClient: notion });

  const translationsDir = path.join(process.cwd(), 'content', 'translations');
  await fs.mkdir(translationsDir, { recursive: true });

  // 기존 번역 파일 로드 (있는 경우)
  const translationsFilePath = path.join(translationsDir, 'translations.json');
  try {
    const existingContent = await fs.readFile(translationsFilePath, 'utf-8');
    Object.assign(translatedContent, JSON.parse(existingContent));
    console.log('📂 Loaded existing translations');
  } catch {
    console.log('📝 No existing translations found, starting fresh');
  }

  let translationCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    console.log(`\n📄 Processing: ${post.title} (${post.slug})`);

    if (!translatedContent[post.slug]) {
      translatedContent[post.slug] = {};
    }

    // Notion에서 마크다운 가져오기
    const mdBlocks = await n2m.pageToMarkdown(post.id);
    const { parent: markdown } = n2m.toMarkdownString(mdBlocks);

    // 한국어 원본 저장
    if (!translatedContent[post.slug].ko) {
      translatedContent[post.slug].ko = {
        title: post.title,
        description: post.description || '',
        markdown: markdown,
      };
    }

    for (const lang of languages) {
      // 이미 번역된 경우 스킵
      if (
        translatedContent[post.slug][lang] &&
        translatedContent[post.slug][lang].markdown
      ) {
        console.log(`  ✓ ${lang.toUpperCase()}: Already translated, skipping`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`  🔄 ${lang.toUpperCase()}: Translating...`);

        const translatedTitle = await translateText(post.title, lang);
        const translatedDescription = post.description
          ? await translateText(post.description, lang)
          : '';
        const translatedMarkdown = await translateMarkdown(markdown, lang);

        translatedContent[post.slug][lang] = {
          title: translatedTitle,
          description: translatedDescription,
          markdown: translatedMarkdown,
        };

        console.log(`  ✅ ${lang.toUpperCase()}: ${translatedTitle}`);
        translationCount++;

        // API rate limit 방지를 위한 대기 (1초)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`  ❌ ${lang.toUpperCase()}: Translation failed`, error);
      }
    }

    // 중간 저장 (API 실패 시 재시작 가능)
    await fs.writeFile(translationsFilePath, JSON.stringify(translatedContent, null, 2));
  }

  console.log('\n✨ Translation complete!');
  console.log(`📊 Total translations: ${translationCount}`);
  console.log(`⏭️  Skipped (already translated): ${skippedCount}`);
  console.log(`💾 Saved to: ${translationsFilePath}`);
}

// 스크립트 실행
translatePosts().catch((error) => {
  console.error('❌ Translation failed:', error);
  process.exit(1);
});
