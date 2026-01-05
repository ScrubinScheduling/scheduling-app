import { SignedIn, SignedOut } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import { createApiClient } from "@scrubin/api-client";
import { auth } from "@clerk/nextjs/server";

type NavLink = {
	href: string;
	name: string;
};
export default async function AppLayout({
	children,
	params
}: {
	children: React.ReactNode;
	params: Promise<{ id: string }>
}) {

	const { id } = await params

	const { getToken } = await auth();
	const apiClient = createApiClient({
		baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
		getToken
	});

	const workspaces = await apiClient.getWorkspaces();
	const navlinks: NavLink[] = [
		{ href: `/workspaces/${id}/user/dashboard`, name: "Dashboard" },
		// { href: `/workspaces/${id}/user/requests`, name: "Requests" },
		{ href: `/workspaces/${id}/user/calendar`, name: "Calendar" },
	];
	
	return (
		<>
			<SignedIn>
				<Navbar workspaces={workspaces} navlinks={navlinks}/>
				{children}
			</SignedIn>
			<SignedOut>
				{/* Hide app chrome when signed out */}
			</SignedOut>
		</>
	);
}

