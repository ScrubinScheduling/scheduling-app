"use client";

import React from "react";
import RequestsTabBar from "../../../../../../components/RequestsTabBar";

export default function RequestsLayout({
    children,
 }: {
    children: React.ReactNode
 }) {
  return (
    <>
      <RequestsTabBar />
      <main className="mx-auto max-w-6xl w-full">{children}</main>
    </>
  );
}