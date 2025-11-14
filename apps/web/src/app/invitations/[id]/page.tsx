import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import InvitationCard from "../../../../components/InvitationCard";
import { createApiClient } from "@scrubin/api-client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {

    const { getToken } = await auth();

    const { id } = await params;

    const apiClient = createApiClient({
        baseUrl: "http://localhost:4000",
        getToken: async () => await getToken()
    });

    try {
        const data = await apiClient.getInvitation(id);
        const { workspaceOwnerName, workspaceOwnerEmail, workspaceName, invitationId, workspaceId } = data;

        return (
            <main className="min-h-screen flex flex-col bg-white">
                <div className="flex flex-1 items-center justify-center px-4">
                    <div className="w-full max-w-md">
                        <InvitationCard
                            workspaceName={workspaceName}
                            workspaceOwnerEmail={workspaceOwnerEmail}
                            workspaceOwnerName={workspaceOwnerName}
                            invitationId={invitationId}
                            workspaceId={workspaceId}
                        />

                    </div>
                </div>
            </main>
        );
    } catch (error) {
        return redirect("/not-found");
    }
}