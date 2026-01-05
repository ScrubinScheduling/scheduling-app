import { SignedIn, SignedOut } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import { auth } from "@clerk/nextjs/server";
import { createApiClient } from "@scrubin/api-client";

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
	console.log(workspaces)
	//   const { id } = useParams<{ id: string }>();
	const navlinks = [
		{
			href: `/workspaces/${id}/admin/dashboard`,
			name: "Dashboard"
		},
		{
			href: `/workspaces/${id}/admin/team`,
			name: "Team"
		},
		// {
		// 	href: `/workspaces/${id}/admin/requests`,
		// 	name: "Requests"
		// },
		{
			href: `/workspaces/${id}/admin/timesheets`,
			name: "Timesheets"
		}
	];
	return (
		<>
			<SignedIn>
				<Navbar workspaces={workspaces} navlinks={navlinks} />
				{children}
			</SignedIn>
			<SignedOut>
				{/* Hide app chrome when signed out */}
			</SignedOut>
		</>
	);
}
