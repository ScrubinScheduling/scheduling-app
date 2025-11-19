"use client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

export default function ClockinCard() {
    return (
        <Card className="p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl">Current Shift</h2>
                    <p className="text-md text-muted-foreground font-medium">
                        Today, 9:00 AM - 5:00 PM
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className="h-8 px-3 py-1 text-xs font-medium rounded-lg"
                >
                    Upcoming
                </Badge>
            </div>

            <div className="flex justify-between items-start mt-4">
                <div className="">
                    <p className="text-lg text-muted-foreground font-medium">
                        Starts At
                    </p>
                    <p className="font-semibold text-4xl">9:00am</p>
                </div>

                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-medium text-muted-foreground">
                            Working with
                        </h3>
                    </div>
                    <div className="flex items-center">
                        <Avatar className="h-10 w-10">
                            <AvatarImage
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
                                alt="Team member"
                            />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-10 w-10">
                            <AvatarImage
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop"
                                alt="Team member"
                            />
                            <AvatarFallback>SM</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-10 w-10">
                            <AvatarImage
                                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop"
                                alt="Team member"
                            />
                            <AvatarFallback>AL</AvatarFallback>
                        </Avatar>
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium text-muted-foreground">+2</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex w-full gap-3 mt-4">
                <Button variant="outline" className="w-1/2 text-2xl">
                    Clock in
                </Button>
                <Button variant="outline" className="w-1/2">
                    Find Cover/Trade
                </Button>
            </div>
        </Card>
    );
}

