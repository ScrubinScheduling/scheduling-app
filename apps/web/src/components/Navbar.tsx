'use client';
import Link from 'next/link';
import { Bell, CalendarDays } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';

type NavLink = {
  href: string;
  name: string;
};

export default function Navbar({ navlinks }: { navlinks: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="border-border flex items-center justify-between border-b px-6 py-4">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-primary h-5 w-5" />
          <span className="text-sm font-medium tracking-wide">Scrubin</span>
        </div>

        <div className="flex items-center gap-6">
          {navlinks.map((navlink) => (
            <Link
              key={navlink.name}
              className={`text-sm ${pathname.startsWith(navlink.href) ? 'text-foreground' : 'text-muted-foreground'} hover:text-muted-foreground font-medium transition-colors`}
              href={navlink.href}
            >
              {navlink.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ModeToggle />
        <Bell className="text-muted-foreground h-5 w-5" />
        <UserButton />
      </div>
    </nav>
  );
}
