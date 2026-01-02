import { Check, ChevronsUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useState } from "react";


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

const workspaces = [
    { id: 1, name: "Fairlight" },
    { id: 2, name: "Clinic" },
    { id: 3, name: "Nebula" },
    { id: 4, name: "Vertex" },
    { id: 5, name: "Summit Group" },
    { id: 6, name: "Catalyst Labs" },
    { id: 7, name: "Zenith Solutions" },
];



function getInitials(text: string) {
    const textArr = text.split(" ");
    return textArr.map(word => word.at(0)).join("")
}

export default function WorkspaceSelector() {
    const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0])
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex rounded-md items-center px-3 py-1.5 border border-border hover:bg-accent transition-colors 
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-2">
                <div className={`w-6 h-6 rounded ${colors[workspaces.indexOf(selectedWorkspace) % colors.length]} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xs font-semibold !text-white">{getInitials(selectedWorkspace.name)}</span>
                </div>
                <span className="text-sm font-medium max-w-[120px]">{selectedWorkspace.name}</span>
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[150px]">

                {workspaces.map((workspace, index) =>
                    <DropdownMenuItem key={workspace.id} 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setSelectedWorkspace(workspace)}
                    >
                        <div className={`w-6 h-6 rounded ${colors[index % colors.length]} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-xs font-semibold !text-white">{getInitials(workspace.name)}</span>
                        </div>
                        <span className="flex-1 truncate text-sm font-medium ">{workspace.name}</span>
                        {workspace.id === selectedWorkspace.id && <Check className="w-4 h-4 text-primary"/>}
                    </DropdownMenuItem>
                )}

            </DropdownMenuContent>
        </DropdownMenu>
    );
}

