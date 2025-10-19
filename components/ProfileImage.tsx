'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export function ProfileImage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 서버 렌더링 시 또는 마운트 전에는 기본 이미지 표시
  if (!mounted) {
    return (
      <Image
        src="/images/profile-light.png"
        alt="HongTale"
        width={144}
        height={144}
        className="object-cover"
      />
    );
  }

  return (
    <Image
      src={theme === 'light' ? '/images/profile-light.png' : '/images/profile-dark.png'}
      alt="HongTale"
      width={144}
      height={144}
      className="object-cover"
    />
  );
}
