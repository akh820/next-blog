'use client';

import React from 'react';
import PhotoCard from '@/components/features/photo/PhotoCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface PhotoModalProps {
  params: Promise<{ id: string }>;
}

export default function PhotoModal({ params }: PhotoModalProps) {
  const router = useRouter();
  const [id, setId] = React.useState('');

  React.useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const handleOpenChange = (open: boolean) => {
    if (!open) router.back();
  };

  return (
    <Dialog defaultOpen onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Photo Card Dialog</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center p-8">
          <PhotoCard id={id} modal={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
