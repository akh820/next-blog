import { getPublishedPosts } from '@/lib/notion';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const posts = await getPublishedPosts();

  return NextResponse.json({ posts });
}
