import { SignedOut } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function Home() {
	const { userId } = await auth();
	if (userId) redirect('/workspaces');
	return (
		<div className="bg-background min-h-screen">
			<SignedOut>
				{/* Header */}
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
								<Button variant="ghost" size={'sm'}>
									Log in
								</Button>
								<Button size={'sm'}>Get Started</Button>
							</div>
						</div>
					</div>
				</header>

				{/* Hero Section */}
				<section className="py-20 lg:py-32">
					<div className="container mx-auto px-4 lg:px-8">
						<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
							{/* Left Content */}
							<div className="space-y-8">
								<Badge
									variant={'secondary'}
									className="w-fit gap-2 border-emerald-200 bg-emerald-50 text-emerald-700"
								>
									<Zap className="size-3" />
									Trusted by 1 Veterinary Clinic
								</Badge>
								<div className="space-y-6">
									<h1 className="text-5xl leading-[1.05] font-bold tracking-tight text-balance lg:text-7xl">
										Staff scheduling made simple
									</h1>
									<p className="text-muted-foreground max-w-xl text-xl leading-relaxed">
										Streamline shift management for your veterinary team. Schedule staff, manage
										time-off, and ensure optimal coverage with ease.
									</p>
								</div>

								<div className="flex flex-col items-start gap-4 sm:flex-row">
									<Button
										size={'lg'}
										className="h-12 gap-2 bg-emerald-600 px-8 text-base hover:bg-emerald-700"
									>
										Begin
										<ArrowRight className="size-4" />
									</Button>
									<Button
										size={'lg'}
										variant={'outline'}
										className="h-12 bg-transparent px-8 text-base"
									>
										Demo
									</Button>
								</div>

								{/* Stats */}
								<div className="grid grid-cols-3 gap-8 border-t pt-8">
									<div className="space-y-1">
										<div className="text-4xl font-bold">5hr</div>
                    <div className='text-sm text-muted-foreground'>Saved Weekly</div>
									</div>
                  <div className="space-y-1">
										<div className="text-4xl font-bold">92%</div>
                    <div className='text-sm text-muted-foreground'>Staff Satisfaction</div>
									</div>
                  <div className="space-y-1">
										<div className="text-4xl font-bold">Zero</div>
                    <div className='text-sm text-muted-foreground'>Scheduling Conflicts</div>
									</div>
								</div>
							</div>

              {/* Right Content */}
						</div>
					</div>
				</section>
			</SignedOut>
		</div>
	);
}
