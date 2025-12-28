import React from 'react';
import { Calendar } from 'lucide-react';
export default function Footer() {
	return (
		<footer className="bg-muted.20 border-t py-12">
			<div className="container mx-auto px-4 lg:px-8">
				<div className="flex flex-col items-center justify-between gap-6 md:flex-row">
					<div className="flex items-center gap-2">
						<div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600">
							<Calendar className="size-5 text-white" />
						</div>
						<span className="text-xl font-semibold"> Scrub In</span>
					</div>
					<div className="text-muted-foreground flex items-center gap-8 text-sm">
						<a href="#" className="hover:text-foreground transition-colors">
							Privacy Policy
						</a>
						<a href="#" className="hover:text-foreground transition-colors">
							Terms of Service
						</a>
						<a href="#" className="hover:text-foreground transition-colors">
							Contact Us
						</a>
					</div>
					<div className="text-muted-foreground text-sm">@ 2025 Scrub In, All rights reserved</div>
				</div>
			</div>
		</footer>
	);
}
