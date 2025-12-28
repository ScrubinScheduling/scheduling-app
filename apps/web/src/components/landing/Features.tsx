import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Clock, Users, Bell, UserPen, CheckCircle2, LucideIcon } from 'lucide-react';
type Feature = {
	icon: LucideIcon;
	title: string;
	description: string;
};

const features: Feature[] = [
	{
		icon: Calendar,
		title: 'Shift Scheduling',
		description:
			'Create and manage staff schedules with. Set recurring shifts and handle changes instantly.'
	},
	{
		icon: Users,
		title: 'Team Availability',
		description:
			'See who else is working on the day, to see if your favourite co-worker is working.'
	},
	{
		icon: Clock,
		title: 'Time Tracking',
		description:
			'Clock-in and clock-out tracking. Monitor overtime and ensure compliance with labor laws.'
	},
	{
		icon: Bell,
		title: 'Shift Notifications',
		description:
			'Reminders for upcoming shifts. Instant notifications for schedule changes and updates.'
	},
	{
		icon: UserPen,
		title: 'Team Management',
		description: 'Invite staff, assign roles, and keep your team organized as your clinic grows.'
	},
	{
		icon: CheckCircle2,
		title: 'Shift Swapping',
		description:
			'Let staff request shift swaps with approval workflows. Maintain coverage without the phone tag.'
	}
];

export default function Features() {
	return (
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
	);
}
