import { SignedOut } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Benefits from '@/components/landing/Benefits';
import Future from '@/components/landing/Future';
import Footer from '@/components/landing/Footer';

export default async function Home() {
	const { userId } = await auth();
	if (userId) redirect('/workspaces');
	return (
		<div className="bg-background min-h-screen">
			<SignedOut>
				<Header />
				<Hero />
				<Features />
				<Benefits />
				<Future />
				<Footer />
			</SignedOut>
		</div>
	);
}
