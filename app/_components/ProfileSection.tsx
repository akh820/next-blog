import { ProfileImage } from '@/components/ProfileImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Youtube, Github, BookOpen, Instagram } from 'lucide-react';
import Image from 'next/image';

const socialLinks = [
  // {
  //   icon: Youtube,
  //   href: 'https://github.com/akh820',
  // },
  {
    icon: Github,
    href: 'https://github.com/akh820',
  },
  {
    icon: BookOpen,
    href: 'https://akh820.github.io',
  },
  // {
  //   icon: Instagram,
  //   href: 'https://github.com/akh820',
  // },
];

export default function ProfileSection() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="jusity-center flex">
            <div className="bg-muted rounded-full p-2">
              <div className="h-36 w-36 overflow-hidden rounded-full">
                <ProfileImage />
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold">안계홍</h3>
            <p className="text-primary text-sm>">Full Stack Developer</p>
          </div>
          <div className="flex justify-center gap-10">
            {socialLinks.map((item, index) => (
              <Button key={index} variant="ghost" className="bg-primary/10" size="icon" asChild>
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  <item.icon className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </div>

          {/* <p className="bg-primary/10 rounded p-2 text-center text-sm">개발자..?</p> */}
        </div>
      </CardContent>
    </Card>
  );
}
