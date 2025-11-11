import { Separator } from '@/components/ui/separator';

import { getPostBySlug } from '@/lib/notion';

import GiscusComments from '@/components/GiscusComments';

import { notFound } from 'next/navigation';

import { Metadata } from 'next';

import ClientPostContent from '@/components/blog/ClientPostContent';

// 동적 메타데이터 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await getPostBySlug(slug);

  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다',
      description: '요청하신 블로그 포스트를 찾을 수 없습니다.',
    };
  }

  return {
    title: post.title,
    description: post.description || `${post.title} - 홍테일 블로그`,
    keywords: post.tags,
    authors: [{ name: post.author || '홍테일' }],
    publisher: '홍테일',
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modifiedDate,
      authors: post.author || '홍테일',
      tags: post.tags,
    },
  };
}

// Docker 빌드 시 환경 변수가 없어서 에러 발생 으로 인해 , ISR 로변경
export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface BlogPostProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { slug } = await params;
  const { markdown, post } = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container py-6 md:py-8 lg:py-12">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr_240px] md:gap-8">
        <aside className="hidden md:block">{/* 추후 콘텐츠 추가 */}</aside>
        <section>
          {/* 블로그 본문 - 클라이언트 컴포넌트로 언어별 처리 (제목, 메타정보, 목차 및 본문 포함) */}
          <ClientPostContent postId={post.id} initialPost={post} initialMarkdown={markdown} />

          <Separator className="my-16" />

          {/* 이전/다음 포스트 네비게이션 */}
          <GiscusComments />
        </section>
        <aside className="relative hidden md:block">
          <div className="sticky top-[var(--sticky-top)]">
            {/* 데스크탑 목차는 ClientPostContent에서 렌더링 */}
            <ClientPostContent
              postId={post.id}
              initialPost={post}
              initialMarkdown={markdown}
              renderDesktopToc={true}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
