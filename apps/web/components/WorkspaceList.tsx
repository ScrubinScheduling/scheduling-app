import React from "react";
import WorkspaceCard from "./WorkspaceCard";
import CreateWorkspaceCard from "./CreateWorkspaceCard";
import type { Workspace } from "@scrubin/schemas";

export default function WorkspaceList({ workspaces }: { workspaces: Workspace[] }) {

    return (
        <div className="flex flex-col gap-1.5">
            {workspaces.map((workspace, index) => {
                return <WorkspaceCard workspace={workspace} key={index} />
            })}
            <CreateWorkspaceCard />
        </div>

    )
}