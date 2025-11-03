"use client";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import AppHeader from "../../../../components/AppHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedIn>
        <AppHeader />
        {children}
      </SignedIn>
      <SignedOut>
        {/* Hide app chrome when signed out */}
      </SignedOut>
    </>
  );
}

