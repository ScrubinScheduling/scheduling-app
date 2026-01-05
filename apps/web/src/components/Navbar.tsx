'use client';
import Link from "next/link";
import { Bell, CalendarDays } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useParams, usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import WorkspaceSelector from "./WorkspaceSelector";
import { Workspace } from "@scrubin/schemas";


type NavLink = {
	href: string;
	name: string;
};

export default function Navbar({ navlinks, workspaces }: { navlinks: NavLink[]; workspaces: Workspace[] }) {

	const pathname = usePathname();
	const params = useParams<{ id: string }>();

	return (
		<nav className="flex items-center justify-between px-6 py-4 border-b border-border">

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

				<WorkspaceSelector selectedWorkspace={workspaces.find((w) => w.id === Number(params.id))} workspaces={workspaces} />
				{/* <Bell className="w-5 h-5 text-muted-foreground" /> */}
				<ModeToggle />
				<UserButton />

			</div>

		</nav>

	);
}
