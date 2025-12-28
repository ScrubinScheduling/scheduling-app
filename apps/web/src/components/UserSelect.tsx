'use client';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User } from "@scrubin/schemas";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import React from "react";
export default function UserSelect({ users, selectedUserId }: { users: User[], selectedUserId: string | undefined; }) {


    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();

    const onChange = (id: string) => {
        const searchParams = new URLSearchParams(sp);
        searchParams.set("userId", id);
        router.replace(`${pathname}?${searchParams.toString()}`);
    }

    return (
        <Select onValueChange={onChange} value={selectedUserId}>

            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a User" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Users</SelectLabel>

                    {users.map(user =>
                        <SelectItem key={user.id} value={user.id}>{user.firstName} {user.lastName}</SelectItem>
                    )}

                </SelectGroup>
            </SelectContent>
        </Select>);

}