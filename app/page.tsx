import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Youtube, Github, BookOpen, Instagram, Megaphone, HandshakeIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import Link from 'next/link';

const mockTags = [
  { name: '전체', count: 20 },
  { name: 'HTML', count: 10 },
  { name: 'CSS', count: 5 },
  { name: 'JavaScript', count: 3 },
  { name: 'React', count: 3 },
  { name: 'Next.js', count: 3 },
];

const socialLinks = [
  {
    icon: Youtube,
    href: 'https://github.com/akh820',
  },
  {
    icon: Github,
    href: 'https://github.com/akh820',
  },
  {
    icon: BookOpen,
    href: 'https://github.com/akh820',
  },
  {
    icon: Instagram,
    href: 'https://github.com/akh820',
  },
];

const contactItems = [
  {
    icon: Megaphone,
    title: '오늘 공부한것',
    description: 'Algorithm | CS',
    mailto: {
      email: 'aka820@naver.com',
      subject: '',
      body: '',
    },
  },
  // {
  //   icon: BookOpen,
  //   title: '강의 문의',
  //   description: '기술 강의, 워크샵, 세미나 진행',
  //   mailto: {
  //     email: 'aka820@naver.com',
  //     subject: '',
  //     body: '',
  //   },
  // },
  {
    icon: HandshakeIcon,
    title: '이메일',
    description: 'aka820@naver.com',
    mailto: {
      email: 'aka820@naver.com',
      subject: '',
      body: '',
    },
  },
];

export default function Home() {
  return (
    <div className="container py-8">
      <div className="grid grid-cols-[200px_1fr_220px] gap-6">
        {/*좌측 사이드바 */}
        <aside>
          <Card>
            <CardHeader>
              <CardTitle>태그 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {mockTags.map((tag) => {
                  return (
                    <Link href={`?tag=${tag.name}`} key={tag.name}>
                      <div className="hover:bg-muted-foreground/10 text-muted-foreground flex items-center justify-between rounded-md p-1.5 text-sm transition-colors">
                        <span>{tag.name}</span>
                        <span>{tag.count}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-8">
          {/* 섹션 제목 */}
          <h2 className="text-3xl font-bold tracking-tight">블로그 목록</h2>

          {/* 블로그 카드 그리드 */}
          <div className="grid gap-4">
            {/* 블로그 카드 반복 */}
            {[1, 2, 3].map((i) => (
              <Link href={`/blog/${i}`} key={i}>
                <Card key={i}>
                  <CardHeader>
                    <CardTitle>블로그 제목 {i}</CardTitle>
                    <CardDescription>
                      이것은 블로그 포스트에 대한 간단한 설명입니다. 여러 줄의 텍스트가 있을 수
                      있습니다.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        {/*우측 사이드바 */}
        <aside className="flex flex-col gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="jusity-center flex">
                  <div className="bg-muted rounded-full p-2">
                    <div className="h-36 w-36 overflow-hidden rounded-full">
                      <Image
                        src="/images/favicon.PNG"
                        alt="Hong"
                        width={144}
                        height={144}
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-bold">안계홍</h3>
                  <p className="text-primary text-sm>">Full Stack Developer</p>
                </div>
                <div className="flex justify-center gap-2">
                  {socialLinks.map((item, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="bg-primary/10"
                      size="icon"
                      asChild
                    >
                      <a href={item.href} target="_blank" rel="noopener noreferrer">
                        <item.icon className="h-4 w-4" />
                      </a>
                    </Button>
                  ))}
                </div>

                <p className="bg-primary/10 rounded p-2 text-center text-sm">개발자..?</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>문의하기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contactItems.map((item, index) => (
                  <a
                    key={index}
                    // href={`mailto:${item.mailto.email}?subject=${encodeURIComponent(
                    //   item.mailto.subject
                    // )}&body=${encodeURIComponent(item.mailto.body)}`}
                    className="group bg-primary/5 hover:bg-muted flex items-start gap-4 rounded-lg p-3 transition-colors"
                  >
                    <div className="bg-primary/20 text-primary flex shrink-0 items-center justify-center rounded-md p-1.5">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-muted-foreground text-xs">{item.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
