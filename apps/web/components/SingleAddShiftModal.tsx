import React, {useEffect, useState} from 'react';
import { DatePicker, Modal, Select, TimePicker, Alert, Button } from 'antd';
import dayjs, {Dayjs} from 'dayjs';
import { User, Shift } from '@scrubin/schemas';
import { useApiClient } from '@/hooks/useApiClient';

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
  selectedDay: Dayjs | null;
  users: User[];
  workspaceId: number;   
}


const withTime = (d : Dayjs, t : Dayjs) => {
  const timeSet = d.set("hour", t.hour()).set("minute", t.minute());
  return timeSet.toDate().toISOString(); 
}



const SingleAddShiftModal = ({open, setOpen, user, selectedDay, users, workspaceId} : Props) => {
    const apiClient = useApiClient(); 
    const [selectedUser, setSelectedUser] = useState<User | null>(null); 
    const [day, setDay] = useState<Dayjs | null>(null);
    const [timeRange, setTimeRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [isLoading, setIsLoading] = useState<boolean>(false); 
    const [err, setErr] = useState<string>(""); 

    useEffect(() => setDay(selectedDay), [selectedDay]);
    useEffect(() => setSelectedUser(user), [user]); 

    const handleSubmit = async() => {
        try {
          if (!timeRange[0] || !timeRange[1] || !selectedDay || !day || !selectedUser) throw new Error("Not all fields filled out");
          setIsLoading(true);
          const startTime = withTime(day, timeRange[0]);
          const endTime = withTime(day, timeRange[1]);

          console.log("Is submitting");

          await apiClient.createShift(workspaceId, {
            user: selectedUser.id,
            workspaceId,
            shifts :[{
              startTime,
              endTime
            }],
            breakDuration: 30,
          }); 

          setOpen(false); 

        } catch (error) {
            console.log(error);
            setErr("Unable to add shift");
        } finally{
          setIsLoading(false);
        }
    }

    const handleCancel = () => {
      setOpen(false); 
      setErr(""); 
    }


  return (
    <Modal
    centered={true}
    open={open}
    onCancel={handleCancel}
    footer={null}
    title={"Add New Shift"}
    width={'full'}
    onOk={handleSubmit}
    loading={isLoading}
    >
        <div className='flex flex-1 flex-col justify-evenly items-center p-2 gap-5'>
            {err && (<Alert message={err} type='error' showIcon />)}
            
            

            <Select 
            className='w-full'
            value={selectedUser?.id ?? null}
            onChange={(value, label) => {
               if (!value || !label) return;

              setSelectedUser({
              id: value,
              firstName: String(label)
            })}}
            options={users?.map((user: User) => ({
              value: user.id,
              label: user.firstName
            }))} />


            <TimePicker.RangePicker
            className='min-w-[150px]'
            format={'HH:mm'}
            onChange={(dates, dateStrings)=> {
              setTimeRange(dates ?? [null, null]);
            }}
            
            />

            <DatePicker 
            format={"YYYY-MM-d"}
            className='w-full'
            value={day}
            onChange={(val : Dayjs) => {
              setDay(val);
            }}
            />

            <div className='flex flex-row gap-5'>
              <Button type='default' danger onClick={handleCancel}>
                Cancel
              </Button>
              <Button type='primary' onClick={handleSubmit} loading={isLoading}>
                Create
              </Button>
            </div>
        </div>
    </Modal>
  )
}

export default SingleAddShiftModal