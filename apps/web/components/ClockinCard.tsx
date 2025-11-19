"use client";
import { useState } from "react";
import { Coffee, Play, Square, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

function ShiftTradeDialog({ children }: { children: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Find Cover / Trade Shift</DialogTitle>
                    <DialogDescription>
                        Request a shift trade or find cover for your shift.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        Shift trade functionality coming soon...
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function ClockinCard() {
    const [status, setStatus] = useState<"scheduled" | "active" | "break" | "completed">("scheduled");

    const coworkers = [
        { name: "John D.", initials: "JD", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" },
        { name: "Sarah M.", initials: "SM", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" },
        { name: "Alex L.", initials: "AL", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop" },
    ];

    return (
        <Card className="border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-medium">Current Shift</CardTitle>
                        {status === "active" && (
                            <Badge variant="outline" className="bg-red-500/15 text-red-500 border-red-500/20 animate-pulse">
                                <span className="relative flex h-2 w-2 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                Live
                            </Badge>
                        )}
                    </div>
                    <CardDescription>
                        {status === "scheduled"
                            ? "Today, 9:00 AM - 5:00 PM"
                            : status === "active"
                                ? "Shift in progress"
                                : status === "break"
                                    ? "Break in progress"
                                    : "Shift completed"}
                    </CardDescription>
                </div>
                <Badge
                    variant={status === "active" ? "default" : status === "break" ? "secondary" : "outline"}
                    className={`px-3 py-1 text-xs font-medium ${
                        status === "active" ? "bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/20" : ""
                    } ${status === "break" ? "bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 border-yellow-500/20" : ""}`}
                >
                    {status === "scheduled" && "Upcoming"}
                    {status === "active" && "Active"}
                    {status === "break" && "On Break"}
                    {status === "completed" && "Completed"}
                </Badge>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="flex flex-col items-center md:items-start space-y-1">
                        <span className="text-sm text-muted-foreground">
                            {status === "scheduled" ? "Starts at" : status === "break" ? "Break Started" : "Clocked In"}
                        </span>
                        <div className="text-4xl font-bold tracking-tighter">
                            {status === "scheduled" ? "9:00 AM" : status === "break" ? "12:30 PM" : "9:00 AM"}
                        </div>
                    </div>

                    {status !== "completed" && (
                        <div className="flex flex-col items-center md:items-end space-y-2">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <Users className="w-4 h-4" /> Working with
                            </span>
                            <div className="flex -space-x-2">
                                {coworkers.map((coworker, i) => (
                                    <Avatar key={i} className="border-2 border-background w-8 h-8">
                                        <AvatarImage src={coworker.img} alt={coworker.name} />
                                        <AvatarFallback>{coworker.initials}</AvatarFallback>
                                    </Avatar>
                                ))}
                                <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
                                    +2
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {status === "scheduled" && (
                        <Button className="w-full h-12 text-base" onClick={() => setStatus("active")}>
                            <Play className="mr-2 h-4 w-4" /> Clock In
                        </Button>
                    )}

                    {status === "active" && (
                        <>
                            <Button variant="secondary" className="w-full h-12 text-base" onClick={() => setStatus("break")}>
                                <Coffee className="mr-2 h-4 w-4" /> Start Break
                            </Button>
                            <Button variant="destructive" className="w-full h-12 text-base" onClick={() => setStatus("completed")}>
                                <Square className="mr-2 h-4 w-4 fill-current" /> Clock Out
                            </Button>
                        </>
                    )}

                    {status === "break" && (
                        <Button className="w-full col-span-2 h-12 text-base" onClick={() => setStatus("active")}>
                            <Play className="mr-2 h-4 w-4" /> End Break & Resume
                        </Button>
                    )}

                    {status === "completed" && (
                        <Button variant="outline" className="w-full col-span-2 h-12 text-base" disabled>
                            Shift Ended at 5:00 PM
                        </Button>
                    )}

                    {/* Find Cover / Trade Button - Only visible when not clocked in or active */}
                    {status === "scheduled" && (
                        <ShiftTradeDialog>
                            <Button variant="outline" className="w-full h-12 text-base border-dashed">
                                <RefreshCw className="mr-2 h-4 w-4" /> Find Cover / Trade
                            </Button>
                        </ShiftTradeDialog>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

