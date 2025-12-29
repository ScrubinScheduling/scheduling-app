"use client";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { id } = useParams<{ id: string }>();
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
        <Navbar navlinks={navlinks}/>
        {children}
      </SignedIn>
      <SignedOut>
        {/* Hide app chrome when signed out */}
      </SignedOut>
    </>
  );
}

