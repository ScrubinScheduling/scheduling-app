"use client";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import UserAppHeader from "../../../../../components/UserAppHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedIn>
        <UserAppHeader />
        {children}
      </SignedIn>
      <SignedOut>
        {/* Hide app chrome when signed out */}
      </SignedOut>
    </>
  );
}

