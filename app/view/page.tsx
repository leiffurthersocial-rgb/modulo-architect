'use client';
import dynamic from 'next/dynamic';

const Viewer = dynamic(() => import('@/features/walk/Viewer'), { ssr: false });

export default function ViewPage() {
  return <Viewer />;
}
