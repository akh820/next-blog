'use client';
import Giscus from '@giscus/react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';

import { GISCUS_LANG_MAP } from '@/lib/types/language';

export default function GiscusComments() {
  const { theme } = useTheme();

  const { language } = useLanguage();

  return (
    <Giscus
      repo="gymcoding/notion-blog-nextjs-giscus"
      repoId="R_kgDOOHw4QQ"
      category="Announcements"
      categoryId="DIC_kwDOOHw4Qc4Cn9v2"
      mapping="pathname"
      strict="0"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme={theme === 'dark' ? 'dark' : 'light'}
      lang={GISCUS_LANG_MAP[language]}
    />
  );
}
