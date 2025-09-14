import { Youtube, Github, BookOpen, Instagram, Megaphone, HandshakeIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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

export default function ContactSection() {
  return (
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
  );
}
