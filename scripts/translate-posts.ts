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
import crypto from 'crypto';

// .env 파일 로드 (.env.production 우선, 없으면 .env.local)
const envPath = process.env.NODE_ENV === 'production'
  ? path.join(process.cwd(), '.env.production')
  : path.join(process.cwd(), '.env.local');
config({ path: envPath });

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

// 이미지 다운로드 및 저장 함수
async function downloadImage(url: string, postSlug: string): Promise<string> {
  try {
    // 이미지 파일명 생성 (URL 해시 + 확장자)
    const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 12);

    // URL에서 파일 확장자 추출
    let extension = path.extname(new URL(url).pathname).split('?')[0] || '.png';
    const filename = `${postSlug}-${hash}${extension}`;

    // public/images/posts/ 디렉토리 확인
    const publicDir = path.join(process.cwd(), 'public', 'images', 'posts');
    await fs.mkdir(publicDir, { recursive: true });

    const filepath = path.join(publicDir, filename);
    const publicUrl = `/images/posts/${filename}`;

    // 이미 파일이 존재하면 다운로드 스킵
    try {
      await fs.access(filepath);
      return publicUrl; // 파일 존재, URL만 반환
    } catch {
      // 파일 없음, 다운로드 진행
    }

    const response = await fetch(url);
    if (!response.ok) {
      return url; // 실패 시 원본 URL
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(filepath, new Uint8Array(buffer));

    return publicUrl;
  } catch (error) {
    return url; // 실패 시 원본 URL 반환
  }
}

// 마크다운 내의 모든 Notion 이미지 URL을 로컬 이미지로 변환
async function downloadMarkdownImages(markdown: string, postSlug: string): Promise<string> {
  let processedMarkdown = markdown;

  // Notion 이미지 URL 패턴 찾기
  const notionImageRegex = /!\[([^\]]*)\]\((https:\/\/prod-files-secure\.s3[^)]+)\)/g;
  const matches = Array.from(markdown.matchAll(notionImageRegex));

  // Notion URL이 없으면 바로 반환
  if (matches.length === 0) {
    return processedMarkdown;
  }

  for (const match of matches) {
    const [fullMatch, altText, imageUrl] = match;

    // 이미지 다운로드 (이미 존재하면 URL만 반환)
    const localUrl = await downloadImage(imageUrl, postSlug);

    // Notion URL인 경우에만 교체 (로컬 URL이면 이미 변환됨)
    if (localUrl.startsWith('/images/posts/')) {
      const newImageMarkdown = `![${altText}](${localUrl})`;
      processedMarkdown = processedMarkdown.replace(fullMatch, newImageMarkdown);
    }
  }

  return processedMarkdown;
}

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
    const placeholder = `<x id="${index++}"/>`;
    placeholders.set(placeholder, content);
    return placeholder;
  };

  // 1. 코드 블록 보호 (```...```) - 가장 먼저 처리
  let protectedText = markdown.replace(/```[\s\S]*?```/g, (match) => createPlaceholder(match));

  // 2. 인라인 코드 보호 (`...`)
  protectedText = protectedText.replace(/`[^`\n]+`/g, (match) => createPlaceholder(match));

  // 3. 이미지 보호 (![alt](url))
  protectedText = protectedText.replace(/!\[([^\]]*)\]\([^)]+\)/g, (match) =>
    createPlaceholder(match)
  );

  // 4. 링크 URL 보호하되 텍스트는 번역 ([text](url) -> [text](<x id="N"/>))
  protectedText = protectedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
    const urlPlaceholder = createPlaceholder(url);
    return `[${text}](${urlPlaceholder})`;
  });

  // 5. HTML 블록 전체 보호 (<details>, <summary> 등)
  protectedText = protectedText.replace(/<details[\s\S]*?<\/details>/gi, (match) =>
    createPlaceholder(match)
  );

  // 6. 나머지 HTML 태그만 보호 (태그 안의 텍스트는 번역되도록)
  protectedText = protectedText.replace(/<[^>]+>/g, (match) => createPlaceholder(match));

  return { text: protectedText, placeholders };
}

// 번역된 텍스트에 원본 콘텐츠 복원
function restoreProtectedContent(
  translatedText: string,
  placeholders: Map<string, string>
): string {
  let restored = translatedText;

  // Placeholder를 역순으로 복원
  const entries = Array.from(placeholders.entries()).reverse();

  for (const [placeholder, original] of entries) {
    // 정규식 특수문자 이스케이프
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPlaceholder, 'g');
    restored = restored.replace(regex, original);
  }

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
      tag_handling: 'xml',
      ignore_tags: 'x',
      preserve_formatting: '1',
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

    let markdown: string;

    // 한국어 원본이 이미 있으면 재사용, 없으면 Notion에서 가져오기
    if (translatedContent[post.slug].ko?.markdown) {
      markdown = translatedContent[post.slug].ko.markdown;
    } else {
      // Notion에서 마크다운 가져오기
      const mdBlocks = await n2m.pageToMarkdown(post.id);
      const { parent: rawMarkdown } = n2m.toMarkdownString(mdBlocks);

      // Notion 이미지를 로컬로 다운로드 (이미 있으면 스킵)
      markdown = await downloadMarkdownImages(rawMarkdown, post.slug);

      // 한국어 원본 저장
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
