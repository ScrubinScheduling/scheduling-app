import WorkspaceOnboarding from "@/components/WorkspaceOnboarding";
import { auth } from "@clerk/nextjs/server";
import { createApiClient } from "@scrubin/api-client";
import { redirect } from "next/navigation";

export default async function Page() {

    const { getToken } = await auth()

    const apiClient = createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        getToken
    });

    const workspaces = await apiClient.getWorkspaces();

    if (workspaces.length !== 0) {
        return redirect(`/workspaces/${workspaces[0].id}`)
    }
    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <WorkspaceOnboarding />
        </main>
    );
}
