'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import type { Post } from '@/types/blog';
import TranslatedContent from './TranslatedContent';

interface ClientPostContentProps {
  slug: string;
  initialPost: Post;
  initialMarkdown: string;
}

export default function ClientPostContent({
  slug,
  initialPost,
  initialMarkdown,
}: ClientPostContentProps) {
  const { language } = useLanguage();
  const [post, setPost] = useState(initialPost);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 한국어면 초기 데이터 사용
    if (language === 'ko') {
      setPost(initialPost);
      setMarkdown(initialMarkdown);
      return;
    }

    // 다른 언어면 번역 파일에서 로드
    const loadTranslation = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/content/translations/translations.json`);
        if (response.ok) {
          const translations = await response.json();
          const translatedPost = translations[slug]?.[language];

          if (translatedPost) {
            setPost({
              ...initialPost,
              title: translatedPost.title,
              description: translatedPost.description,
            });
            setMarkdown(translatedPost.markdown);
          } else {
            // 번역이 없으면 원본 사용
            setPost(initialPost);
            setMarkdown(initialMarkdown);
          }
        }
      } catch (error) {
        console.error('Failed to load translation:', error);
        // 에러 시 원본 사용
        setPost(initialPost);
        setMarkdown(initialMarkdown);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslation();
  }, [language, slug, initialPost, initialMarkdown]);

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold md:text-4xl">
          {isLoading ? (
            <span className="opacity-50">{initialPost.title}</span>
          ) : (
            post.title
          )}
        </h1>
      </div>
      <TranslatedContent markdown={markdown} />
    </>
  );
}
