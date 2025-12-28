import { TimePicker } from "antd";
import { Dayjs } from "dayjs";
import React from "react";

export default function TimeSelector({
    time,
    onTimeChange,
}: {
    time: Dayjs | null;
    onTimeChange: (value: Dayjs) => void;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
            </label>
            <TimePicker
                format="HH:mm"
                value={time}
                onChange={onTimeChange}
                className="w-full"
                minuteStep={5}
            />
        </div>
    );
}