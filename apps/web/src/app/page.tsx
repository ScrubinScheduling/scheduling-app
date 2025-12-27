import { SignedOut } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function Home() {
	const { userId } = await auth();
	if (userId) redirect('/workspaces');
	return (
		<div className="bg-background min-h-screen">
			<SignedOut>
				{/* Header */}
				<header className="border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b ">
					<div className="container mx-auto px-4 lg:px-8">
						<div className="flex h-16 items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600">
									<Calendar className="size-5 text-white" />
								</div>
								<span className="text-xl font-semibold">Scrub In</span>
							</div>

							<nav className="hidden items-center gap-8 md:flex">
								<a
									href="#features"
									className="text-muted-foreground hover:text-foreground text-md font-medium transition-colors"
								>
									Features
								</a>
								<a
									href="#features"
									className="text-muted-foreground hover:text-foreground text-md font-medium transition-colors"
								>
									Why Us
								</a>

								<a
									href="#features"
									className="text-muted-foreground hover:text-foreground text-md font-medium transition-colors"
								>
									Future
								</a>
							</nav>
							<div className="flex items-center gap-3">
								<Button variant="ghost" size={"sm"}>
									Log in
								</Button>
								<Button size={"sm"}>Get Started</Button>
							</div>
						</div>
					</div>
				</header>
			</SignedOut>
		</div>
	);
}
