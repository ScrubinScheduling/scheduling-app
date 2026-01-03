import React from 'react';
import ClockinCard from '@/components/ClockinCard';
import UpcomingSchedule from '@/components/UpcomingScheduleCard';

export default function Page() {
  return (
    <main className="bg-card min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-semibold">Overview</h1>
        <p className="text-muted-foreground text-lg font-medium">
          Manage your shifts, breaks, and schedule.
        </p>
        <div className="space-y-4">
          <ClockinCard />
          <UpcomingSchedule />
        </div>
      </div>
    </main>
  );
}
