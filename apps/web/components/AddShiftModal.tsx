import React, { startTransition, useMemo, useState } from "react";
import { Dayjs } from "dayjs";
import { useApiClient } from "@/hooks/useApiClient";
import {
  Modal,
  Select,
  TimePicker,
  DatePicker,
  Button,
  Flex,
  Alert,
} from "antd";
import { LoadingOutlined } from '@ant-design/icons';

type AddShiftModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  users: any;
  workspaceId: Number;
  onSuccess?: ()=> void | Promise<void>;  

};


const AddShiftModal: React.FC<AddShiftModalProps> = ({ open, setOpen, users, workspaceId, onSuccess }) => {
  const [user, setUser] = useState<any | undefined>(undefined);
  const [dates, setDates] = useState<Dayjs[] | null>(null);
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [alertDesc, setAlertDesc] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const clientAPI = useApiClient();

  const handleCancel = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    setAlertDesc(null);
    if (!user || !dates || !timeRange) {
      setAlertDesc("Please fill in all fields.");
      setOpenAlert(true);
      return;
    }

    const shifts = buildShift(dates, timeRange);

    const payload = {
      user,
      workspaceId,
      breakDuration: 30,
      shifts,
    };

    try {
      setIsSubmitting(true); 
      const data = await clientAPI.createShift(workspaceId, payload);
      console.log(data); 
      console.log("Submitting shift:", payload);

      setAlertDesc(null);
      setOpenAlert(false);
      setUser(undefined);
      setDates(null);
      setTimeRange(null);
      
      if (onSuccess) {
        await onSuccess();
      }
      else {
        setOpen(false); 
      }

      setIsSubmitting(false);

    } catch (e) {
      console.log("Error adding shifts", e);
      setAlertDesc("Could not create shift. Please try again.");
    } finally{
      setIsSubmitting(false);
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
                value={user}
                style={{ width: 200 }}
                placeholder="Select Employee"
                onChange={(value) => setUser(value)}
                options={users?.map((user: { id: any; firstName: any; }) => ({
                value: String(user.id),
                label: user.firstName,
                })) ?? []}
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
              loading={isSubmitting ? { icon: <LoadingOutlined /> } : false}
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
