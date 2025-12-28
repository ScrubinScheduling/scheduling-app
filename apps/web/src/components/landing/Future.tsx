import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Sparkle } from 'lucide-react';

type FutureFeature = {
	title: string;
	description: string;
	status: string;
};

const futureFeatures: FutureFeature[] = [
	{
		title: 'Mobile App',
		description:
			'Native iOS and Android apps for staff to view schedules and clock in/out on the go.',
		status: 'Q1 2025'
	},
	{
		title: 'AI Schedule Optimization',
		description:
			'Intelligent suggestions for optimal staff scheduling based on historical data and patterns.',
		status: 'Q2 2025'
	},
	{
		title: 'Payroll Integration',
		description: 'Direct integration with popular payroll systems like ADP, Gusto, and QuickBooks.',
		status: 'Q2 2025'
	},
	{
		title: 'Skills & Certifications',
		description:
			'Track staff certifications, licenses, and specialized skills to ensure compliance.',
		status: 'Q3 2025'
	},
	{
		title: 'Advanced Reporting',
		description:
			'Custom reports, labor cost forecasting, and predictive analytics for better planning.',
		status: 'Q3 2025'
	},
	{
		title: 'Multi-Location Support',
		description:
			'Manage staff across multiple clinic locations with centralized control and reporting.',
		status: 'Q4 2025'
	}
] as const;

export default function Future() {
	return (
		<section id="future" className="bg-muted/30 py-20 lg:py-32">
			<div className="container mx-auto px-4 lg:px-8">
				<div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
					<Badge
						variant={'secondary'}
						className="mx-auto w-fit gap-2 border-emerald-200 bg-emerald-50 text-emerald-700"
					>
						<Sparkle className="size-3" />
						Coming Soon
					</Badge>
					<h2 className="text-4xl font-bold tracking-tight text-balance lg:text-5xl">
						What's next for Scrub In
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						we're constantly improving. Here are the features we're building next based on feedback
						from veterinary clinics like yours.
					</p>
				</div>

				<div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
					{futureFeatures.map((feature, i) => (
						<Card
							key={i}
							className="bg-card group relative space-y-4 overflow-hidden p-6 transition-all hover:shadow-lg"
						>
							<div className="absolute top-0 right-0 h-32 w-32 translate-x-16 -translate-y-16 rounded-full bg-emerald-50 transition-transform group-hover:scale-150" />
							<div className="relative">
								<div className="mb-3 flex items-start justify-between">
									<Badge
										variant={'secondary'}
										className="border-emerald-200 text-xs text-emerald-700"
									>
										{feature.status}
									</Badge>
								</div>
								<h3 className="mv-2 text-xl font-semibold">{feature.title}</h3>
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
