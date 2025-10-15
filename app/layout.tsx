import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import Providers from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Memento Vitae',
    default: 'Memento Vitae',
  },
  description: '개인의 경험을 기록하는 블로그',
  keywords: ['Next.js', '프론트엔드', '웹개발', '코딩', '프로그래밍', '리액트'],
  authors: [{ name: 'hongTale', url: 'https://github.com/akh820' }],
  creator: '',
  publisher: 'hongTale',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  metadataBase: new URL('https://next-blog-angyehongs-projects.vercel.app/'),
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Header />
          <main className="flex min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
