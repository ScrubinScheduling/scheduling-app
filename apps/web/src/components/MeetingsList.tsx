import React from "react";
import MeetingCard from "./MeetingCard";
import { Meetings } from "@scrubin/schemas";

import { Meeting } from "@scrubin/schemas";

interface MeetingsListProps {
    meetings: Meeting[];
    onSelect: (id: number) => void;
    selectedId?: number;
    onDelete: (id: number) => void;
}

export default function MeetingsList({ meetings, onSelect, selectedId, onDelete }: MeetingsListProps) {
    return (
        <>
            {meetings.map((m) => {
                const isSelected = m.id === selectedId;
                

                return (
                   <MeetingCard 
                        meeting={m}
                        onSelect={onSelect}
                        isSelected={isSelected}
                        onDelete={onDelete}
                   />
                );
            })}
        </>
    )
}
