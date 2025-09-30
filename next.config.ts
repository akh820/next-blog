import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';

const nextConfig: NextConfig = {
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
