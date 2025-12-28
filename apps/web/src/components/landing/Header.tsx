import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

export default function Header() {
	return (
		<header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
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
							href="#benefits"
							className="text-muted-foreground hover:text-foreground text-md font-medium transition-colors"
						>
							Why Us
						</a>

						<a
							href="#future"
							className="text-muted-foreground hover:text-foreground text-md font-medium transition-colors"
						>
							Future
						</a>
					</nav>
					<div className="flex items-center gap-3">
						<Button variant="ghost" size={'sm'} asChild>
							<Link href="/sign-in">Log in</Link>
						</Button>
						<Button size={'sm'} asChild>
							<Link href="/sign-up">Get Started</Link>
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
