'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import type { Post } from '@/types/blog';
import TranslatedContent from './TranslatedContent';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User, ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/date';

interface ClientPostContentProps {
  postId: string;
  initialPost: Post;
  initialMarkdown: string;
  renderDesktopToc?: boolean;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// 마크다운에서 헤딩 추출
function extractTocFromMarkdown(markdown: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = markdown.split('\n');

  lines.forEach((line) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      // 일본어 히라가나(ぁ-ん), 카타카나(ァ-ヶ), 한자(一-龯)도 포함
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9가-힣ぁ-んァ-ヶ一-龯\s-]/g, '')
        .replace(/\s+/g, '-');

      headings.push({ id, text, level });
    }
  });

  return headings;
}

export default function ClientPostContent({
  postId,
  initialPost,
  initialMarkdown,
  renderDesktopToc = false,
}: ClientPostContentProps) {
  const { language } = useLanguage();
  const [post, setPost] = useState(initialPost);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [toc, setToc] = useState<TocItem[]>(extractTocFromMarkdown(initialMarkdown));
  const [isLoading, setIsLoading] = useState(false);

  // 제목 렌더링을 위한 데이터
  const displayTitle = isLoading ? initialPost.title : post.title;

  // 초기값을 ref로 저장 (재렌더링 시 변경 방지)
  const initialPostRef = useRef(initialPost);
  const initialMarkdownRef = useRef(initialMarkdown);

  useEffect(() => {
    // 한국어면 초기 데이터 사용
    if (language === 'ko') {
      setPost(initialPostRef.current);
      setMarkdown(initialMarkdownRef.current);
      setToc(extractTocFromMarkdown(initialMarkdownRef.current));
      setIsLoading(false);
      return;
    }

    // 다른 언어면 번역 파일에서 로드
    let isMounted = true; // cleanup 플래그

    const loadTranslation = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/content/translations/translations.json`);
        if (!isMounted) return;

        if (response.ok) {
          const translations = await response.json();
          const translatedPost = translations[postId]?.[language];

          if (!isMounted) return;

          if (translatedPost) {
            // 번역된 마크다운에서 만료된 Notion 이미지 URL을 원본의 최신 URL로 교체
            let updatedMarkdown = translatedPost.markdown;
            const originalMarkdown = initialMarkdownRef.current;

            // 원본 마크다운에서 모든 이미지 URL 추출
            const originalImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
            const originalImages: { alt: string; url: string }[] = [];
            let match;

            while ((match = originalImageRegex.exec(originalMarkdown)) !== null) {
              originalImages.push({ alt: match[1], url: match[2] });
            }

            // 번역된 마크다운의 이미지 URL을 원본의 최신 URL로 교체
            originalImages.forEach((img) => {
              // 이미지 alt 텍스트를 기준으로 URL 교체 (alt는 보통 같음)
              const escapedAlt = img.alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const translatedImageRegex = new RegExp(
                `!\\[${escapedAlt}\\]\\([^)]+\\)`,
                'g'
              );
              updatedMarkdown = updatedMarkdown.replace(
                translatedImageRegex,
                `![${img.alt}](${img.url})`
              );
            });

            setPost({
              ...initialPostRef.current,
              title: translatedPost.title,
              description: translatedPost.description,
            });
            setMarkdown(updatedMarkdown);
            setToc(extractTocFromMarkdown(updatedMarkdown));
          } else {
            // 번역이 없으면 원본 사용
            setPost(initialPostRef.current);
            setMarkdown(initialMarkdownRef.current);
            setToc(extractTocFromMarkdown(initialMarkdownRef.current));
          }
        } else {
          if (!isMounted) return;
          setPost(initialPostRef.current);
          setMarkdown(initialMarkdownRef.current);
        }
      } catch (error) {
        if (!isMounted) return;
        // 에러 시 원본 사용
        setPost(initialPostRef.current);
        setMarkdown(initialMarkdownRef.current);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTranslation();

    return () => {
      isMounted = false;
    };
  }, [language, postId]);

  // 번역 안내 문구
  const translationNotice = {
    ko: '',
    en: 'This post has been automatically translated.',
    ja: 'この記事は自動翻訳されています。',
  };

  // 개인 기록 안내 문구
  const disclaimerNotice = {
    ko: '이 페이지는 공부를 위해 개인이 기록한 것이므로, 언제든지 내용이 변하거나 수정될 수 있으며, 부정확한 내용이 있을 수도 있습니다.',
    en: 'This page is a personal record for study purposes, so the content may change or be modified at any time, and there may be inaccuracies.',
    ja: 'このページは学習のための個人的な記録であり、内容はいつでも変更または修正される可能性があり、不正確な内容が含まれている場合があります。',
  };

  // 데스크톱 목차만 렌더링하는 경우
  if (renderDesktopToc) {
    return (
      <>
        {toc.length > 0 && (
          <div className="bg-muted/60 space-y-4 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold">
              {language === 'ko' ? '목차' : language === 'en' ? 'Table of Contents' : '目次'}
            </h3>
            <nav className="space-y-3 text-sm">
              {toc.map((item) => (
                <div key={item.id} className="space-y-2">
                  <a
                    href={`#${item.id}`}
                    className="hover:text-foreground text-muted-foreground block font-medium transition-colors"
                    style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
                  >
                    {item.text}
                  </a>
                </div>
              ))}
            </nav>
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      {/* 태그 */}
      <div className="mb-4 flex gap-2">
        {initialPost.tags?.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      {/* 제목 */}
      <h1 className="mb-4 text-3xl font-bold md:text-4xl">
        {isLoading ? (
          <span className="opacity-50">{initialPost.title}</span>
        ) : (
          displayTitle
        )}
      </h1>

      {/* 메타 정보 */}
      <div className="text-muted-foreground mb-8 flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <User className="h-4 w-4" />
          <span>{initialPost.author}</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          <span>{formatDate(initialPost.date)}</span>
        </div>
      </div>

      {/* 모바일 목차 */}
      {toc.length > 0 && (
        <div className="sticky top-[var(--sticky-top)] mb-6 md:hidden">
          <details className="bg-muted/60 group rounded-lg p-4 backdrop-blur-sm">
            <summary className="flex cursor-pointer items-center gap-2 text-lg font-semibold">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              {language === 'ko' ? '목차' : language === 'en' ? 'Table of Contents' : '目次'}
            </summary>
            <nav className="mt-3 space-y-2 text-sm">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="hover:text-foreground text-muted-foreground block transition-colors"
                  style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </details>
        </div>
      )}

      {/* 본문 */}
      <TranslatedContent markdown={markdown} toc={toc} />

      {/* 개인 기록 안내 문구 */}
      <p className="text-muted-foreground mt-8 text-sm">
        {disclaimerNotice[language as keyof typeof disclaimerNotice]}
      </p>

      {/* 번역 안내 문구 */}
      {language !== 'ko' && translationNotice[language as keyof typeof translationNotice] && (
        <p className="text-muted-foreground mt-2 text-sm">
          {translationNotice[language as keyof typeof translationNotice]}
        </p>
      )}
    </div>
  );
}

// TOC 컴포넌트를 export (page.tsx에서 사용)
export { type TocItem };
