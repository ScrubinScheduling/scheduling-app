import { SignedOut } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
	ArrowRight,
	Bell,
	Calendar,
	LucideIcon,
	UserCheck,
	Zap,
	Users,
	Clock,
	BarChart3,
	CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type StaffMember = {
	name: string;
	role: string;
	shift: string;
	color: string;
};

type Feature = {
	icon: LucideIcon;
	title: string;
	description: string;
};

type Stat = {
	label: string;
	value: string;
	subtext: string;
};

const staff: StaffMember[] = [
	{ name: 'Dr. Inoka Gamage', role: 'Veterinarian', shift: '8:00AM - 6:00PM', color: 'emerald' },
	{ name: 'Sabrina Rogers', role: 'Vet Tech', shift: '10:00AM - 4:00PM', color: 'blue' },
	{ name: 'Denae Myers', role: 'Vet Tech', shift: '8:00AM - 6:00PM', color: 'purple' },
	{ name: 'Megan Camper', role: 'General', shift: '9:00AM - 6:00PM', color: 'orange' },
	{ name: 'Alaina Malaina', role: 'Receptionist', shift: '8:00AM - 5:00PM', color: 'red' }
] as const;

const features: Feature[] = [
	{
		icon: Calendar,
		title: 'Shift Scheduling',
		description:
			'Create and manage staff schedules with drag-and-drop simplicity. Set recurring shifts and handle changes instantly.'
	},
	{
		icon: Users,
		title: 'Team Availability',
		description: 'See who else is working on the day of, to see if it might be a busy day or not.'
	},
	{
		icon: Clock,
		title: 'Time Tracking',
		description:
			'Automatic clock-in and clock-out tracking. Monitor overtime and ensure compliance with labor laws.'
	},
	{
		icon: Bell,
		title: 'Shift Notifications',
		description:
			'Automated reminders for upcoming shifts. Instant notifications for schedule changes and updates.'
	},
	{
		icon: BarChart3,
		title: 'Labor Analytics',
		description:
			'Track labor costs, overtime trends, and staffing efficiency with detailed reports and insights.'
	},
	{
		icon: CheckCircle2,
		title: 'Shift Swapping',
		description:
			'Let staff request shift swaps with approval workflows. Maintain coverage without the phone tag.'
	}
];

const stats: Stat[] = [
	{ label: 'Total Staff Hours', value: '342', subtext: '7 team members' },
	{ label: 'Coverage Rate', value: '100%', subtext: 'All shifts filled' },
	{ label: 'Overtime Hours', value: '4.5', subtext: 'Within budget' }
];

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
									href="#benifits"
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
										{staff.map((staff, index) => (
											<div
												key={staff.name}
												className="bg-muted/50 border-border hover:bg-muted flex items-center gap-4 rounded-xl border p-4 transition-colors"
											>
												<div
													className={`size-12 rounded-full bg-${staff.color}-100 flex shrink-0 items-center justify-center`}
												>
													<UserCheck className={`size-6 text-${staff.color}-600`} />
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

				{/* Features */}
				<section id="features" className="bg-muted/30 py-20 lg:py-32">
					<div className="container mx-auto px-4 lg:px-8">
						<div className=",ax-w-3xl mx-auto mb-16 space-y-4 text-center">
							<Badge variant={'secondary'} className="mx-auto w-fit">
								Features
							</Badge>
							<h2 className="text-4xl font-bold tracking-tight text-balance lg:text-5xl">
								Everything for staff management
							</h2>
							<p className="text-muted-foreground text-lg leading-relaxed">
								Powerful tools designed to specifically for veterinary clinic workforce scheduling
							</p>
						</div>

						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{features.map((feature, i) => (
								<Card
									key={i}
									className="bg-card space-y-4 p-6 transition-all hover:border-emerald-200 hover:shadow-lg"
								>
									<div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100">
										<feature.icon className="size-6 text-emerald-600" />
									</div>
									<div className="space-y-2">
										<h3 className="text-xl font-semibold">{feature.title}</h3>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{feature.description}
										</p>
									</div>
								</Card>
							))}
						</div>
					</div>
				</section>

				{/* Benifits */}
				<section id="benifits" className="py-20 lg:py-32">
					<div className="container mx-auto px-4 lg:px-8">
						<div className="grid items-center gap-16 lg:grid-cols-2">
							<div className="space-y-8">
								<Badge variant={'secondary'} className="w-fit">
									Why Scrub In
								</Badge>
								<h2 className="text-4xl font-bold tracking-tight text-balance lg:text-5xl">
									Built for veterinary teams
								</h2>
								<p className="text-muted-foreground text-lg leading-relaxed">
									Stop using spreadsheets and group chats. Scrub In gives you a professional
									scheduling platform designed for the unique needs of veterinary practices.
								</p>
								<div className="space-y-4">
									{[
										'Stop wrestling with spreadsheets and streamline your scheduling workflow.',
										'Improve team reliability with automated shift reminders and updates.',
										'Spot coverage gaps instantly with visual conflict detection.',
										'Track certifications and ensure qualified staff per shift',
										'Export accurate, error-free timesheets directly to your payroll provider.'
									].map((benifit, i) => (
										<div key={i} className="flex items-start gap-3">
											<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
											<span className="text-foreground leading-relaxed">{benifit}</span>
										</div>
									))}
								</div>
								<Button size={'lg'} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
									Get Started
									<ArrowRight className="size-4" />
								</Button>
							</div>

							<div className="relative">
								<Card className="bg-card p-8 shadow-xl">
									<div className="space-y-6">
										<div className="flex items-center justify-between border-b pb-4">
											<span className="text-lg font-semibold">This Week</span>
											<Badge
												variant={'secondary'}
												className="border-emerald-200 bg-emerald-100 text-emerald-700"
											>
												Fully Staffed
											</Badge>
										</div>
										<div className="space-y-4">
                      {stats.map((stat, i) => (
                        <div key={i} className='p-5 rounded-xl bg-muted/50 border border-border'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <div className='text-sm text-muted-foreground mb-1'>{stat.label}</div>
                              <div className='text-3xl font-bold'>{stat.value}</div>
                              <div className='text-xs text-muted-foreground mt-1'>{stat.subtext}</div>
                            </div>
                            <div className='size-12 rounded-full bg-emerald-100 flex items-center justify-center'>
                              <CheckCircle2 className='size-6 text-emerald-600'/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
									</div>
								</Card>
							</div>
						</div>
					</div>
				</section>
			</SignedOut>
		</div>
	);
}
