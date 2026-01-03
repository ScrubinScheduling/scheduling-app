'use client';

import React from 'react';
import RequestsTabBar from '@/components/RequestsTabBar';

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RequestsTabBar />
      <main className="mx-auto w-full max-w-6xl">{children}</main>
    </>
  );
}
