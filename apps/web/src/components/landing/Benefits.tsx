import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Stat = {
  label: string;
  value: string;
  subtext: string;
};

const stats: Stat[] = [
  { label: 'Staff Capacity', value: 'Unlimited', subtext: 'Grow without limits' },
  { label: 'Schedule Types', value: 'Flexible', subtext: 'Fixed, rotating, or open' },
  { label: 'Time Sheet Export', value: 'Instant', subtext: 'One-click generation' }
];

export default function Benefits() {
  return (
    <section id="benefits" className="py-20 lg:py-32">
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
              Stop using spreadsheets and group chats. Scrub In gives you a professional scheduling
              platform designed for the unique needs of veterinary practices.
            </p>
            <div className="space-y-4">
              {[
                'Stop wrestling with spreadsheets and streamline your scheduling workflow.',
                'Improve team reliability with automated shift reminders and updates.',
                'Spot coverage gaps instantly with visual conflict detection.',
                'Export accurate, error-free timesheets directly to your payroll provider.'
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <span className="text-foreground leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>
            <Button size={'lg'} className="gap-2 bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/sign-up">
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="relative">
            <Card className="bg-card p-8 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <span className="text-lg font-semibold">What We Do</span>
                  <Badge
                    variant={'secondary'}
                    className="border-emerald-200 bg-emerald-100 text-emerald-700"
                  >
                    Fully Staffed
                  </Badge>
                </div>
                <div className="space-y-4">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-muted/50 border-border rounded-xl border p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-muted-foreground mb-1 text-sm">{stat.label}</div>
                          <div className="text-3xl font-bold">{stat.value}</div>
                          <div className="text-muted-foreground mt-1 text-xs">{stat.subtext}</div>
                        </div>
                        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
                          <CheckCircle2 className="size-6 text-emerald-600" />
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
  );
}
