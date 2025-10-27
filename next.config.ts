import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const nextConfig: NextConfig = {
  output: 'standalone', // Docker 배포를 위한 standalone 모드
  images: {
    remotePatterns: [
      {
        hostname: 'picsum.photos',
      },
      {
        hostname: 'images.unsplash.com',
      },
      {
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
      {
        hostname: 'www.notion.so',
      },
    ],
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx', 'md'],
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      // rehypeRaw,        // HTML 태그 처리
      rehypeHighlight, // 코드 하이라이팅
    ],
  },
});

export default withMDX(nextConfig);
