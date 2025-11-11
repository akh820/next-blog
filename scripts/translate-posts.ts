import { Language } from '@/lib/types/language';
import { NotionToMarkdown } from 'notion-to-md';
import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  PersonUserObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import type { Post } from '@/types/blog';
import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';

// .env.local 파일 로드
config({ path: path.join(process.cwd(), '.env.local') });

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// 스크립트용 getPublishedPosts (unstable_cache 없이)
async function getPublishedPostsForScript(): Promise<Post[]> {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Published',
          },
        },
      ],
    },
    page_size: 100,
  });

  const posts = response.results
    .filter((page): page is PageObjectResponse => 'properties' in page)
    .map((page) => {
      const { properties } = page;

      const getCoverImage = (cover: PageObjectResponse['cover']) => {
        if (!cover) return '';
        switch (cover.type) {
          case 'external':
            return cover.external.url;
          case 'file':
            return cover.file.url;
          default:
            return '';
        }
      };

      return {
        id: page.id,
        title:
          properties.Title.type === 'title'
            ? (properties.Title.title[0]?.plain_text ?? '')
            : '',
        description:
          properties.Description.type === 'rich_text'
            ? (properties.Description.rich_text[0]?.plain_text ?? '')
            : '',
        coverImage: getCoverImage(page.cover),
        tags:
          properties.Tags.type === 'multi_select'
            ? properties.Tags.multi_select.map((tag) => tag.name)
            : [],
        author:
          properties.Author.type === 'people'
            ? ((properties.Author.people[0] as PersonUserObjectResponse)?.name ?? '')
            : '',
        date: properties.Date.type === 'date' ? (properties.Date.date?.start ?? '') : '',
        modifiedDate: page.last_edited_time,
        slug:
          properties.Slug.type === 'rich_text'
            ? (properties.Slug.rich_text[0]?.plain_text ?? page.id)
            : page.id,
      };
    });

  return posts;
}

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

  // 5. HTML 태그만 보호 (태그 안의 텍스트는 번역되도록)
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
    // Placeholder가 번역되어 변형된 경우를 처리
    // 예: __PLACEHOLDER_0__ -> PLACEHOLDER_0__, __placeholder_0__ 등
    const variations = [
      placeholder, // 원본
      placeholder.replace('__PLACEHOLDER_', '__placeholder_'), // 소문자
      placeholder.replace('__PLACEHOLDER_', 'PLACEHOLDER_'), // 앞 __ 제거
      placeholder.replace('__PLACEHOLDER_', 'placeholder_'), // 앞 __ 제거 + 소문자
      placeholder.replace('__', ''), // 모든 __ 제거
      placeholder.replace(/_/g, '\\_'), // 이스케이프된 언더스코어
      placeholder.replace(/_/g, ' '), // 언더스코어가 공백으로 변경
      // 일본어 번역에서 발생할 수 있는 변형
      placeholder.replace('__PLACEHOLDER_', 'プレースホルダー_'),
      placeholder.replace('__PLACEHOLDER_', 'プレースホルダ_'),
    ];

    variations.forEach((variant) => {
      // 정규식 특수문자 이스케이프
      const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      restored = restored.replace(new RegExp(escapedVariant, 'g'), original);
    });
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

  const posts = await getPublishedPostsForScript();
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

  // public 폴더로 복사 (클라이언트에서 접근 가능하도록)
  const publicTranslationsDir = path.join(process.cwd(), 'public', 'content', 'translations');
  await fs.mkdir(publicTranslationsDir, { recursive: true });
  const publicTranslationsPath = path.join(publicTranslationsDir, 'translations.json');
  await fs.copyFile(translationsFilePath, publicTranslationsPath);
  console.log(`📦 Copied to public: ${publicTranslationsPath}`);
}

// 스크립트 실행
translatePosts().catch((error) => {
  console.error('❌ Translation failed:', error);
  process.exit(1);
});
