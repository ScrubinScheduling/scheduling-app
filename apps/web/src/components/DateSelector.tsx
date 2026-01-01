import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
export default function DateSelector({
    selectedDate,
    onSelect,
}: {
    selectedDate: Date | null;
    onSelect: (date: Date | undefined) => void;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
            </label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                            selectedDate.toLocaleDateString("en-CA", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selectedDate ?? undefined}
                        onSelect={onSelect}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}