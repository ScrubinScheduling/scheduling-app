import React, {useState} from 'react';
import { DatePicker, Modal, Select, TimePicker } from 'antd';
import dayjs, {Dayjs} from 'dayjs';
import { User, Shift } from '@scrubin/schemas';

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
  selectedDay: Dayjs | null;
  users: User[];  
}


const SingleAddShiftModal = ({open, setOpen, user, selectedDay, users} : Props) => {
    const [day, setDay] = useState<Dayjs>(dayjs(new Date()));

    const handleSubmit = () => {
        try {
            
        } catch (error) {
            
        }
    }


  return (
    <Modal
    centered={true}
    open={open}
    onCancel={() => setOpen(false)}
    title={"Add New Shift"}
    width={'full'}
    >
        <div className='flex flex-1 flex-col justify-evenly items-center p-2 gap-5'>
            <Select className='w-full'

            options={users?.map((user: User) => ({
              value: user.id,
              label: user.firstName
            }))} />


            <TimePicker.RangePicker
            className='min-w-[150px]'
            format={'HH:mm'}
            
            />

            <DatePicker 
            format={"YYYY-MM-ddd"}
            className='w-full'
            value={selectedDay}
            onChange={(val : Dayjs) => {
              setDay(val);
            }}
            />
        </div>
    </Modal>
  )
}

export default SingleAddShiftModal