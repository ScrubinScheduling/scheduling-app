import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import InvitationCard from "../../../../components/InvitationCard";

export default async function Page({ params }) {

    const { getToken } = await auth();
    const token = await getToken();

    const { id } = await params;

    const res = await fetch(`http://localhost:4000/invitations/${id}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) {
        return redirect("/not-found");
    }

    const { workspaceOwnerName, workspaceOwnerEmail, workspaceName, invitationId } = await res.json();


    return (
        <main className="min-h-screen flex flex-col bg-white">
            <div className="flex flex-1 items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <InvitationCard
                        workspaceName={workspaceName}
                        workspaceOwnerEmail={workspaceOwnerEmail}
                        workspaceOwnerName={workspaceOwnerName}
                        invitationId={invitationId}
                    />

                </div>
            </div>
        </main>
    );
}