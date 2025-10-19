export const siteConfig = {
  name: "GyeHong's voyage",
  title: "GyeHong's voyage",
  description: '개인의 경험을 기록하는 블로그',
  author: {
    name: '안계홍',
    github: 'https://github.com/akh820',
    email: 'aka820@naver.com',
  },
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ogImage: '/images/og-image.png',
  keywords: ['Next.js', '프론트엔드', '웹개발', '코딩', '프로그래밍', '리액트'],
  links: {
    github: 'https://github.com/akh820',
    // 필요한 다른 링크들
  },
} as const;
