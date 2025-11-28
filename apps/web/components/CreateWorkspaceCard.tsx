"use client";
import React, { useState } from "react";
import {
    Card,
    CardHeader,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@scrubin/api-client";

export default function CreateWorkspaceCard() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const { getToken } = useAuth();

    const apiClient = createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL as string,
        getToken
    });

    const handleWorkspaceCreation = async () => {
        try {
            await apiClient.createWorkspace({
                name,
                location
            });

            setName("");
            setLocation("");
            setIsOpen(false);
        } catch (error) {
            console.error("Workspace Not Created", error);
        }
    }

    return (
        <>
            <Card onClick={() => setIsOpen(true)} className="hover:bg-gray-50 hover:cursor-pointer border border-dashed">
                <CardHeader className="flex items-center">
                    <Plus className="h-4 w-4 text-gray-600" />

                    <span className="text-md font-medium text-gray-600 text-left">Create Workspace</span>
                </CardHeader>

            </Card>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>

                        <Button onClick={handleWorkspaceCreation} disabled={!name.trim() || !location.trim()}>Create</Button>
                    </DialogFooter>

                </DialogContent>
            </Dialog>

        </>

    );

}