'use client';

import { useLanguage } from '@/contexts/LanguageContext';

import { useTranslation } from '@/hooks/useTranslation';

import { MDXRemote } from 'next-mdx-remote/rsc';

import remarkGfm from 'remark-gfm';

import rehypeSanitize from 'rehype-sanitize';

import rehypePrettyCode from 'rehype-pretty-code';

import withSlugs from 'rehype-slug';

interface TranslatedContentProps {
  markdown: string;
}

export default function TranslatedContent({ markdown }: TranslatedContentProps) {
  const { language } = useLanguage();

  const { translatedText, isLoading } = useTranslation(markdown, language);

  return (
    <div className="prose prose-neutral dark:prose-invert prose-headings:scroll-mt-[var(--header-height)] max-w-none">
      {isLoading ? (
        <div className="opacity-50">
          <p>번역 중...</p>
        </div>
      ) : (
        <MDXRemote
          source={translatedText}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],

              rehypePlugins: [withSlugs, rehypeSanitize, rehypePrettyCode],
            },
          }}
        />
      )}
    </div>
  );
}
