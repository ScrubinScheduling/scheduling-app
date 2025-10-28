import React, { useState } from "react";
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

type AddShiftModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const AddShiftModal: React.FC<AddShiftModalProps> = ({ open, setOpen }) => {
  const [employee, setEmployee] = useState<string | undefined>(undefined);
  const [dates, setDates] = useState<Dayjs[] | null>(null);
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);
   const [alertDesc, setAlertDesc] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const handleCancel = () => {
    setOpen(false);
  };

  const handleSubmit = () => {

    if (!employee || !dates || !timeRange) {
      setAlertDesc("Please fill in all fields.");
      setOpenAlert(true);
      return;
    }

    const payload = {
      employee,
      startTime: timeRange?.[0]?.format("HH:mma") ?? null,
      endTime: timeRange?.[1]?.format("HH:mma") ?? null,
      dates: (dates ?? []).map((d) => d.format("YYYY-MM-DD")),
    };

    console.log("Submitting shift:", payload);
    setAlertDesc(null);
    setOpenAlert(false);
    setEmployee(undefined);
    setDates(null);
    setTimeRange(null);
    setOpen(false);
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
          {openAlert ? <Alert 
          message={alertDesc || "Please fill in all fields."}
          type="warning"
          showIcon
          />: null}
          <span className="text-xl font-bold">Add Shift</span>
          {/* Container */}
          <div className="flex flex-row gap-5 w-full justify-evenly ">
            {/* Employee Selection */}
            <div className="flex flex-col">
              <text className="text-md font-semibold">Employee</text>
              <Select
                showSearch
                value={employee}
                style={{ width: 200 }}
                placeholder="Select Employee"
                onChange={(value) => setEmployee(value)}
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
              <text className="font-semibold">Time</text>
              <TimePicker.RangePicker
                format={"HH:mma"}
                value={timeRange}
                onChange={(vals) => {
                  setTimeRange(vals as [Dayjs, Dayjs]);
                }}
                allowClear
              />
            </div>
            {/* Date Selection */}
            <div className="flex flex-col min-w-[200px]">
              <text className="font-semibold">Date</text>
              <Flex>
                <DatePicker
                  multiple
                  value={dates}
                  format={"YYYY-MM-DD"}
                  maxTagCount={"responsive"}
                  onChange={(vals, strs) => {
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
