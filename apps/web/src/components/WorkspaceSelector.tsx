'use client'
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useState } from "react";
import { Workspace } from "@scrubin/schemas";
import { redirect } from "next/navigation";
import { Separator } from "./ui/separator";
import CreateWorkspaceModal from "./CreateWorkspaceModal";

const colors = [
    "bg-blue-500",
    "bg-cyan-500",
    "bg-teal-500",
    "bg-sky-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-blue-700",
    "bg-teal-700",
    "bg-gray-500",
];



function getInitials(text: string) {
    const textArr = text.split(" ");
    return textArr.map(word => word.at(0)).join("").slice(0, 2)
}

export default function WorkspaceSelector({ selectedWorkspace, workspaces: initialWorkspaces }: { selectedWorkspace: Workspace; workspaces: Workspace[] }) {
    const [workspaces, setWorkspaces] = useState(initialWorkspaces);
    const [currentWorkspace, setCurrentWorkspace]= useState(selectedWorkspace);
    const [isOpen, setIsOpen] = useState(false);
    

    return (
        <>

            <DropdownMenu>
                <DropdownMenuTrigger className="flex rounded-md items-center px-3 py-1.5 border border-border hover:bg-accent transition-colors 
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-2">
                    <div className={`w-6 h-6 rounded ${colors[workspaces.indexOf(currentWorkspace) % colors.length]} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-xs font-semibold !text-white">{getInitials(currentWorkspace.name)}</span>
                    </div>
                    <span className="text-sm font-medium max-w-[120px]">{currentWorkspace.name}</span>
                    <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-[180px]">

                    {workspaces.map((workspace, index) =>
                        <DropdownMenuItem key={workspace.id}
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => redirect(`/workspaces/${workspace.id}`)}
                        >
                            <div className={`w-6 h-6 rounded ${colors[index % colors.length]} flex items-center justify-center flex-shrink-0`}>
                                <span className="text-xs font-semibold !text-white">{getInitials(workspace.name)}</span>
                            </div>
                            <span className="flex-1 truncate text-sm font-medium ">{workspace.name}</span>
                            {workspace.id === selectedWorkspace.id && <Check className="w-4 h-4 text-primary" />}
                        </DropdownMenuItem>
                    )}

                    <Separator className="my-1" orientation="horizontal" />

                    <DropdownMenuItem onClick={() => setIsOpen(true)} className="flex items-center gap-3 cursor-pointer text-muted-foreground">

                        <div className="w-6 h-6 flex justify-center items-center border 
                    border-dashed border-muted-foreground rounded">
                            <Plus className="w-3 h-3" />
                        </div>
                        <span className="flex-1 truncate text-sm font-medium">Create Workspace</span>
                    </DropdownMenuItem>

                </DropdownMenuContent>
            </DropdownMenu>

            <CreateWorkspaceModal 
                open={isOpen} 
                onOpenChange={(open) => setIsOpen(open)} 
                onCreate={(workspace) => setWorkspaces([...workspaces, workspace])}
            />

            
        </>


    );
}

