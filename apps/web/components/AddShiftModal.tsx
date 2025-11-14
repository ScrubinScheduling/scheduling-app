import React, { startTransition, useState } from "react";
import { Dayjs } from "dayjs";

import {
  Modal,
  Select,
  TimePicker,
  DatePicker,
  Button,
  Flex,
  Alert,
} from "antd";
import { json } from "stream/consumers";

type AddShiftModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const AddShiftModal: React.FC<AddShiftModalProps> = ({ open, setOpen }) => {
  const [employee, setEmployee] = useState<Number | undefined>(undefined);
  const [dates, setDates] = useState<Dayjs[] | null>(null);
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [alertDesc, setAlertDesc] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [isLoading, setIsloading] = useState(false);

  const handleCancel = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!employee || !dates || !timeRange) {
      setAlertDesc("Please fill in all fields.");
      setOpenAlert(true);
      return;
    }

    const shifts = buildShift(dates, timeRange);

    const payload = {
      employee,
      workspaceId: 1,
      breakDuration: 30,
      shifts,
    };

    try {
      const res = await fetch(`http://localhost:4000/dummy-create-shift`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()) || `HTTP ${res.status}`);
      const data = await res.json();
      console.log(data); 
      console.log("Submitting shift:", payload);
      setAlertDesc(null);
      setOpenAlert(false);
      setEmployee(undefined);
      setDates(null);
      setTimeRange(null);
      setOpen(false);
    } catch (e) {
      console.log("Error adding shifts", e);
    }
  };

  const withTime = (d: Dayjs, t: Dayjs) =>
    d
      .set("hour", t.hour())
      .set("minute", t.minute())
      .set("millisecond", t.millisecond());

  const buildShift = (dates: Dayjs[], [startT, endT]: [Dayjs, Dayjs]) => {
    return dates.map((d) => {
      const start = withTime(d, startT);
      const end = withTime(d, endT);

      return {
        startTime: start.toDate().toISOString(),
        endTime: end.toDate().toISOString(),
      };
    });
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={"full"}
        centered
      >
        <div className="flex flex-col items-center gap-4">
          {openAlert ? (
            <Alert
              message={alertDesc || "Please fill in all fields."}
              type="warning"
              showIcon
            />
          ) : null}
          <span className="text-xl font-bold">Add Shift</span>
          {/* Container */}
          <div className="flex flex-row gap-5 w-full justify-evenly ">
            {/* Employee Selection */}
            <div className="flex flex-col">
              <span className="text-md font-semibold">Employee</span>
              <Select
                showSearch
                value={employee}
                style={{ width: 200 }}
                placeholder="Select Employee"
                onChange={(value) => setEmployee(1)}
                options={[
                  { value: "Alice Cartel", label: "Alice Cartel" },
                  { value: "Bob Itsaboy", label: "Bob Itsaboy" },
                  { value: "Jonny Bravo", label: "Jonny Bravo" },
                  { value: "David Suzuki", label: "David Suzuki" },
                  { value: "Adam Eve", label: "Adam Eve" },
                ]}
                allowClear
              />
            </div>
            {/* Time Selection */}
            <div className="flex flex-col">
              <span className="font-semibold">Time</span>
              <TimePicker.RangePicker
                format={"HH:mm"}
                value={timeRange}
                onChange={(vals) => {
                  setTimeRange(vals as [Dayjs, Dayjs]);
                }}
                allowClear
              />
            </div>
            {/* Date Selection */}
            <div className="flex flex-col min-w-[200px]">
              <span className="font-semibold">Date</span>
              <Flex>
                <DatePicker
                  multiple
                  value={dates}
                  format={"YYYY-MM-DD"}
                  maxTagCount={"responsive"}
                  onChange={(vals) => {
                    setDates(vals as Dayjs[] | null);
                  }}
                  allowClear
                />
              </Flex>
            </div>
          </div>
          <div className="mt-4 flex w-full justify-center gap-2">
            <Button onClick={handleCancel}>
              <span className="text-black font-semibold">Cancel</span>
            </Button>
            <Button
              type="primary"
              className="bg-[#F72585]"
              onClick={handleSubmit}
            >
              Add Shift
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AddShiftModal;
