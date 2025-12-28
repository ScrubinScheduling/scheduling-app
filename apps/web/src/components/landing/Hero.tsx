import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Zap, ArrowRight, Bell, UserCheck } from 'lucide-react';
import Link from 'next/link';

type StaffMember = {
	name: string;
	role: string;
	shift: string;
	color: string;
};

const staff: StaffMember[] = [
	{ name: 'Dr. Inoka Gamage', role: 'Veterinarian', shift: '8:00AM - 6:00PM', color: 'emerald' },
	{ name: 'Sabrina Rogers', role: 'Vet Tech', shift: '10:00AM - 4:00PM', color: 'blue' },
	{ name: 'Denae Myers', role: 'Vet Tech', shift: '8:00AM - 6:00PM', color: 'purple' },
	{ name: 'Megan Camper', role: 'General', shift: '9:00AM - 6:00PM', color: 'orange' },
	{ name: 'Alaina Malaina', role: 'Receptionist', shift: '8:00AM - 5:00PM', color: 'red' }
] as const;

const colorMap: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
};

export default function Hero() {
	return (
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
								asChild
							>
								<Link href="/sign-in">
									Begin
									<ArrowRight className="size-4" />
								</Link>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="relative h-12 bg-transparent px-8 text-base"
								disabled
							>
								Demo
								<Badge
									variant={'secondary'}
									className="pointer-events-none absolute -top-3 -right-10 px-2 py-0 text-xs"
								>
									On the way
								</Badge>
							</Button>
						</div>

						{/* Stats */}
						<div className="grid grid-cols-3 gap-8 border-t pt-8">
							<div className="space-y-1">
								<div className="text-4xl font-bold">0hr</div>
								<div className="text-muted-foreground text-sm">Saved Weekly</div>
							</div>
							<div className="space-y-1">
								<div className="text-4xl font-bold">100%</div>
								<div className="text-muted-foreground text-sm">Staff Satisfaction</div>
							</div>
							<div className="space-y-1">
								<div className="text-4xl font-bold">Zero</div>
								<div className="text-muted-foreground text-sm">Scheduling Conflicts</div>
							</div>
						</div>
					</div>

					{/* Right Content */}
					<div className="relative">
						<div className="border-border bg-card relative overflow-hidden rounded-2xl border shadow-2xl">
							<div className="bg-emerald-600 px-6 py-4 text-white">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm opacity-90">Week of January 27</div>
										<div className="mt-1 text-xl font-semibold">Staff Scheduling</div>
									</div>
									<Badge
										variant={'secondary'}
										className="gap-1.5 border-0 bg-white/50 text-white hover:bg-white/30"
									>
										<div className="size-2 animate-pulse rounded-full bg-white" />
										Live
									</Badge>
								</div>
							</div>

							<div className="space-y-3 p-6">
								{staff.map((staff) => (
									<div
										key={staff.name}
										className="bg-muted/50 border-border hover:bg-muted flex items-center gap-4 rounded-xl border p-4 transition-colors"
									>
										<div
											className={`size-12 rounded-full ${colorMap[staff.color].bg} flex shrink-0 items-center justify-center`}
										>
											<UserCheck className={`size-6 ${colorMap[staff.color].text}`} />
										</div>
										<div className="min-w-0 flex-1">
											<div className="truncate text-sm font-semibold">{staff.name}</div>
											<div className="text-muted-foreground text-xs">{staff.role}</div>
										</div>
										<div className="shrink-0 text-right">
											<div className="text-xs font-medium text-emerald-600">{staff.shift}</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Floating Feedback Card */}
						<Card className="bg-card absolute -right-4 -bottom-4 hidden max-w-xs border border-emerald-200 p-4 shadow-xl lg:block">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
									<Bell className="size-5 text-emerald-600" />
								</div>
								<div className="flex-1">
									<div className="text-sm font-semibold">Shifts Added</div>
									<div className="text-muted-foreground mt-1 text-xs">
										Shifts were successfully added to your schedule!
									</div>
								</div>
							</div>
						</Card>
					</div>
				</div>
			</div>
		</section>
	);
}
