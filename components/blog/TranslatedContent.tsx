'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TranslatedContentProps {
  markdown: string;
  toc?: TocItem[];
}

export default function TranslatedContent({ markdown }: TranslatedContentProps) {
  // 헤딩에 ID 추가하는 커스텀 컴포넌트
  const components: Components = {
    h1: ({ children, ...props }) => {
      const text = String(children);
      // 일본어 히라가나(ぁ-ん), 카타카나(ァ-ヶ), 한자(一-龯)도 포함
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9가-힣ぁ-んァ-ヶ一-龯\s-]/g, '')
        .replace(/\s+/g, '-');
      return (
        <h1 id={id} {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const text = String(children);
      // 일본어 히라가나(ぁ-ん), 카타카나(ァ-ヶ), 한자(一-龯)도 포함
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9가-힣ぁ-んァ-ヶ一-龯\s-]/g, '')
        .replace(/\s+/g, '-');
      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const text = String(children);
      // 일본어 히라가나(ぁ-ん), 카타카나(ァ-ヶ), 한자(一-龯)도 포함
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9가-힣ぁ-んァ-ヶ一-龯\s-]/g, '')
        .replace(/\s+/g, '-');
      return (
        <h3 id={id} {...props}>
          {children}
        </h3>
      );
    },
  };

  return (
    <div className="prose prose-neutral dark:prose-invert prose-headings:scroll-mt-[var(--header-height)] max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          ...components,
          // 이미지 컴포넌트 명시적 처리
          img: ({ src, alt, ...props }) => {
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={src} alt={alt || ''} {...props} loading="lazy" />;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
