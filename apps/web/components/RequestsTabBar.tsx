"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import React from "react";

export default function RequestsTabBar() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const base = `/workspaces/${id}/requests`;

  const tabs = [
    { key: "shift", label: "Shift Requests", href: `${base}/shift` },
    { key: "meeting", label: "Meeting Requests", href: `${base}/meeting` },
  ];
  const active = pathname.startsWith(`${base}/meeting`) ? "meeting" : "shift";

  return (
    <div
      className={[
        "w-full bg-white border-b border-black",
      ].join(" ")}
    >
      <div className="mx-auto max-w-6xl px-4 py-3 flex justify-center">
        <div role="tablist" aria-label="Requests tabs"
             className="relative inline-flex rounded-full bg-gray-100 p-1">
          {tabs.map((t) => {
            const isActive = active === t.key;
            return (
              <Link
                key={t.key}
                href={t.href}
                role="tab"
                aria-selected={isActive}
                className="relative rounded-full px-4 py-2 text-sm font-medium text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                {isActive && (
                  <motion.span
                    layoutId="requests-bubble"
                    className="absolute inset-0 rounded-full bg-gray-300"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
