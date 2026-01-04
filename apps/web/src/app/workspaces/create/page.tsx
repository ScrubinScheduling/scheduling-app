"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Building2, Link2, Plus, Users2 } from "lucide-react";
import React, { useState } from "react";

export default function Page() {
    const [inviteLink, setInviteLink] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");
    const [workspaceLocation, setWorkspaceLocation] = useState("");
    const [mode, setMode] = useState<"create" | "join" | "select">("select");

    if (mode === "join") {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Button
                        className="flex items-center gap-2 text-muted-foreground 
                        hover:text-foreground mb-6 transition-colors !no-underline bg-transparent 
                        hover:bg-transparent p-0 w-0 ml-6"
                        onClick={() => setMode("select")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Back</span>
                    </Button>

                    <Card className="border border-border/60">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-2">
                                <Users2 className="w-6 h-6 text-gray-100" />
                            </div>
                            <CardTitle className="text-2xl">
                                Join a Workspace
                            </CardTitle>
                            <CardDescription>
                                Enter the invite link shared by your team admin
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">

                            <div className="space-y-2">
                                <Label htmlFor="invite-link">Invite Link</Label>
                                <Input
                                    id="invite-link"
                                    placeholder="https://scrubin.app/invitations/..."
                                    value={inviteLink}
                                    onChange={(e) => setInviteLink(e.target.value)}
                                />
                            </div>

                            <Button disabled={!inviteLink.trim()} className="w-full group group-hover:bg-secondary/80 hover:cursor-pointer">
                                Join Workspace
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />

                            </Button>

                        </CardContent>
                    </Card>
                </div>
            </main>
        );


    }

    if (mode === "create") {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Button
                        className="flex items-center gap-2 text-muted-foreground 
                        hover:text-foreground mb-6 transition-colors !no-underline bg-transparent 
                        hover:bg-transparent p-0 w-0 ml-6"
                        onClick={() => setMode("select")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Back</span>
                    </Button>

                    <Card className="border border-border/60">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-2">
                                <Building2 className="w-6 h-6 text-gray-100" />
                            </div>
                            <CardTitle className="text-2xl">
                                Create a Workspace
                            </CardTitle>
                            <CardDescription>
                                Set up a new workspace for your team to collaborate
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">

                            <div className="space-y-2">
                                <Label htmlFor="workspace-name">Workspace Name</Label>
                                <Input
                                    id="workspace-name"
                                    placeholder="Vet Clinic"
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="workspace-location">Workspace Location</Label>
                                <Input
                                    id="workspace-location"
                                    placeholder="Saskatoon, SK"
                                    value={workspaceLocation}
                                    onChange={(e) => setWorkspaceLocation(e.target.value)}
                                />
                            </div>

                            <Button disabled={!workspaceLocation.trim() || !workspaceName.trim()} className="w-full hover:cursor-pointer group group-hover:bg-secondary/80">
                                Create Workspace
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform hover:cursor-pointer" />

                            </Button>

                        </CardContent>
                    </Card>
                </div>
            </main>
        );
    }



    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-semibold tracking-tight text-balance mb-2">
                        Welcome! Lets get you started!
                    </h1>
                    <p className="text-muted-foreground text-pretty">Create a new workspace or join an existing one with an invite link</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="space-y-1">
                            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-2">
                                <Plus className="w-6 h-6 text-gray-100" />
                            </div>
                            <CardTitle className="text-xl">
                                Create a Workspace
                            </CardTitle>
                            <CardDescription>Set up a new workspace for your team to collaborate</CardDescription>
                        </CardHeader>

                        <CardContent>
                            <Button
                                onClick={() => setMode("create")}
                                className="w-full group group-hover:bg-secondary/80 cursor-pointer">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="space-y-1">
                            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-2">
                                <Link2 className="w-6 h-6 text-gray-100" />
                            </div>
                            <CardTitle className="text-xl">
                                Join a Workspace
                            </CardTitle>
                            <CardDescription>Use an invite link to join your team's workspace</CardDescription>
                        </CardHeader>

                        <CardContent>
                            <Button
                                onClick={() => setMode("join")}
                                className="w-full group group-hover:bg-secondary/80 cursor-pointer">
                                Enter Invite Link
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-8">
                    Need help? Contact your workspace administrator for an invite link.
                </p>
            </div>
        </main>
    );
}