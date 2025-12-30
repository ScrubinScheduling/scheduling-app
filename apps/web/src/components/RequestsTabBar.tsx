'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import React from 'react';

export default function RequestsTabBar() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const base = `/workspaces/${id}/admin/requests`;

  const tabs = [
    { key: 'shift', label: 'Shift Requests', href: `${base}/shift` },
    { key: 'meeting', label: 'Meeting Requests', href: `${base}/meeting` }
  ];
  const active = pathname.startsWith(`${base}/meeting`) ? 'meeting' : 'shift';

  return (
    <div className={['bg-background w-full'].join(' ')}>
      <div className="mx-auto flex max-w-6xl justify-center px-4 py-3">
        <div
          role="tablist"
          aria-label="Requests tabs"
          className="bg-muted relative inline-flex rounded-full p-1"
        >
          {tabs.map((t) => {
            const isActive = active === t.key;
            return (
              <Link
                key={t.key}
                href={t.href}
                role="tab"
                aria-selected={isActive}
                className="text-foreground focus-visible:ring-ring relative rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2"
              >
                {isActive && (
                  <motion.span
                    layoutId="requests-bubble"
                    className="bg-accent absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
