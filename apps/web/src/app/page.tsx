import {
  SignedOut,
} from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Home() {

  const { userId } = await auth();
  if (userId) redirect('/dashboard');
  return (
    <main className="mx-auto max-w-2xl p-8">
      <SignedOut>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome</h1>
          <p className="text-lg text-gray-600 mb-8">Please sign in or create an account to get started.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-in"
            className="rounded-lg border-2 border-blue-600 px-6 py-3 text-blue-600 font-medium hover:bg-blue-50 transition-colors duration-200 text-center"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors duration-200 text-center shadow-md"
          >
            Create account
          </Link>
        </div>
      </SignedOut>

      {/* <SignedIn>
          <div className="flex items-center justify-between">
            <p className="text-lg">You’re signed in.</p>
            <UserButton afterSignOutUrl="/" />
          </div>
          <Link
            href="/dashboard"
            prefetch={false} // protected route; avoids noisy prefetch in dev
            className="mt-6 inline-block rounded-lg bg-black px-4 py-2 text-white"
          >
            Go to dashboard
          </Link>
        </SignedIn> */}
    </main>
  );
}
