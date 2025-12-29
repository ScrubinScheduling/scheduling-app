"use client";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import { useParams } from "next/navigation";

type NavLink = {
	href: string;
	name: string;
};
export default function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {

	
	const { id } = useParams<{ id: string }>();

	const navlinks: NavLink[] = [
		{ href: `/workspaces/${id}/user/dashboard`, name: "Dashboard" },
		// { href: `/workspaces/${id}/user/requests`, name: "Requests" },
		{ href: `/workspaces/${id}/user/calendar`, name: "Calendar" },
	];
	
	return (
		<>
			<SignedIn>
				<Navbar navlinks={navlinks}/>
				{children}
			</SignedIn>
			<SignedOut>
				{/* Hide app chrome when signed out */}
			</SignedOut>
		</>
	);
}

