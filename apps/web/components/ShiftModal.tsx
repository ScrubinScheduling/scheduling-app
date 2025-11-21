
import React, { use, useState } from 'react'
import { Modal, Button } from 'antd';
import {Calendar, User, Clock9, MapPin, Trash, Edit} from 'lucide-react';
import {formatLongDate, formatTimeRange} from '../helpers/time';

type Shift = { id: number; startTime: string; endTime: string; breakDuration: number | null };
type User = { id: number; firstName: string; lastName?: string | null };

type ShiftModalProps  = {
    user: User;
    shift: Shift;
    workspaceId: Number | null;
    isVisiable: boolean;   
    onDelete?: (shiftId: number) => void | Promise<void>;
    setIsVisiable: React.Dispatch<React.SetStateAction<boolean>>;  
}



function ShiftModal({user, shift, onDelete, workspaceId, isVisiable, setIsVisiable} : ShiftModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false); 

   const onCancel = () => {
      setIsVisiable(false); 
   }
  const deleteShift = async () => {
    if (!onDelete) return;
    try {
      setIsLoading(true);
      await onDelete(shift.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
};

  return (

    <Modal
    open={isVisiable}
    onCancel={onCancel}
    footer={null}
    width={"full"}
    centered
    style={{minWidth: "600px"}}
    >
        {/* Outline Container */}
        <div className='flex flex-col justify-center gap-8'>
          {/* Header */}        
          <span className='text-2xl font-semibold'>Shift Details - Manger</span>

          {/* Display shift details (View only) */}

          {/* Employee Name */}
          <div className='flex flex-col gap-5'>
            <div className='flex flex-row gap-3 items-center'>
                <div className='p-2 bg-gray-100 rounded-lg'>
                    <User />
                </div>
                <div className='flex flex-col'>
                  <span className='text-md  text-gray-600'>
                    Employee
                  </span>
                  <span className='text-lg font-semibold'>
                    {user.firstName}{" "}{user.lastName}
                  </span>
                </div>
            </div>

            {/* Date */}
            <div className='flex flex-row gap-3 items-center'>
                <div className='p-2 bg-gray-100 rounded-lg'>
                    <Calendar />
                </div>
                <div className='flex flex-col'>
                  <span className='text-md text-gray-600'>
                    Date
                  </span>
                  <span className='text-lg font-semibold'>
                    {formatLongDate(shift.startTime)}
                  </span>
                </div>
            </div>

            {/* Time */}
            <div className='flex flex-row gap-3 items-center'>
                <div className='p-2 bg-gray-100 rounded-lg'>
                    <Clock9 />
                </div>
                <div className='flex flex-col'>
                  <span className='text-md text-gray-600'>
                    Time
                  </span>
                  <span className='text-lg font-semibold'>
                    {formatTimeRange(shift.startTime, shift.endTime)}
                  </span>
                </div>
            </div>

            {/* Location */}                
             {/* Time */}
            <div className='flex flex-row gap-3 items-center'>
                <div className='p-2 bg-gray-100 rounded-lg'>
                    <MapPin />
                </div>
                <div className='flex flex-col'>
                  <span className='text-md text-gray-600'>
                    Location
                  </span>
                  <span className='text-lg font-semibold'>
                    Saskatoon
                  </span>
                </div>
            </div> 
          </div>

          <div className='flex flex-row gap-3'>
            <Button className='flex-1' danger={true} style={{minHeight:"40px"}} onClick={() => {setOpenModal(true)}} loading={isLoading}>
                <div className='flex flex-row items-center gap-1 justify-center'>
                    <Trash size={18}/>
                    <span className='font-semibold'>Delete</span>
                </div>
            </Button>

            <Button className='flex-1' type='primary' style={{minHeight:"40px"}}>
                <div className='flex flex-row items-center gap-1'>
                    <Edit size={18}/>
                    <span className='font-semibold'>Edit</span>
                </div>
            </Button>
          </div>
        </div>

        {/* Confirm Deletion */}
        <Modal
          onCancel={() => {
            setOpenModal(false);
          }}
          open={openModal}
          footer={null}
          centered
        >
            <div className='flex flex-col justify-center items-center gap-3'>
              <span className='text-lg font-bold'>Are you sure you want to delete this shift?</span>
              <div className='flex flex-row gap-3'>
                <Button className='flex-1' onClick={() => {
                  setOpenModal(false); 
                }}>
                  cancel
                </Button>

                <Button type='primary' className='flex-1' danger onClick={deleteShift}>
                  <span className='font-bold'>Delete</span>
                </Button>
              </div>
            </div>
        </Modal>
    </Modal>
  )
}

export default ShiftModal