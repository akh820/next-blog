'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import type { Post } from '@/types/blog';
import TranslatedContent from './TranslatedContent';

interface ClientPostContentProps {
  postId: string;
  initialPost: Post;
  initialMarkdown: string;
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
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
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
            setPost({
              ...initialPostRef.current,
              title: translatedPost.title,
              description: translatedPost.description,
            });
            setMarkdown(translatedPost.markdown);
            setToc(extractTocFromMarkdown(translatedPost.markdown));
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
  }, [language, postId]); // initialPost, initialMarkdown 제거

  return (
    <div>
      {/* 제목 */}
      <h1 className="mb-8 text-3xl font-bold md:text-4xl">
        {isLoading ? (
          <span className="opacity-50">{initialPost.title}</span>
        ) : (
          displayTitle
        )}
      </h1>

      {/* 모바일 목차 */}
      {toc.length > 0 && (
        <div className="sticky top-[var(--sticky-top)] mb-6 md:hidden">
          <details className="bg-muted/60 rounded-lg p-4 backdrop-blur-sm">
            <summary className="cursor-pointer text-lg font-semibold">목차</summary>
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

      {/* 데스크톱 목차 (오른쪽 사이드바용) - prop으로 전달 */}
      {toc.length > 0 && (
        <div className="hidden" data-toc={JSON.stringify(toc)} />
      )}
    </div>
  );
}

// TOC 컴포넌트를 export (page.tsx에서 사용)
export { type TocItem };
