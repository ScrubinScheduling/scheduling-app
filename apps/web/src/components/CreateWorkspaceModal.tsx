"use client";
import React, { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@scrubin/api-client";
import { useApiClient } from "@/hooks/useApiClient";
import { Workspace } from "@scrubin/schemas";

interface CreateWorkspaceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate?: (workspace: Workspace) => void;
}

export default function CreateWorkspaceModal({ open, onOpenChange, onCreate }: CreateWorkspaceModalProps) {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [loading, setLoading] = useState(false);

    const apiClient = useApiClient();

    const handleWorkspaceCreation = async () => {
        setLoading(true);
        try {
            const workspace = await apiClient.createWorkspace({
                name,
                location,
            });
            setName("");
            setLocation("");
            onOpenChange(false);
            if (onCreate) onCreate(workspace);
        } catch (error) {
            // You could show an error toast here in a real app
            console.error("Workspace Not Created", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create a New Workspace</DialogTitle>
                    <DialogDescription>Set up a new workspace for your team.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Workspace Name</Label>
                        <Input
                            id="name"
                            placeholder="Workspace Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Location</Label>
                        <Input
                            id="location"
                            placeholder="Location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleWorkspaceCreation}
                        disabled={!name.trim() || !location.trim() || loading}
                    >
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
