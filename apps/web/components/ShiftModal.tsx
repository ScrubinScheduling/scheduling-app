
import React, { useState, useEffect } from 'react'
import { Modal, Button, Select, DatePicker, TimePicker, Alert } from 'antd';
import {Calendar, User, Clock9, MapPin, Trash, Edit, Send} from 'lucide-react';
import {formatLongDate, formatTimeRange} from '../helpers/time';
import { useApiClient } from '@/hooks/useApiClient';
import dayjs, {Dayjs} from 'dayjs';

type Shift = { id: number; startTime: string; endTime: string; breakDuration: number | null };
type User = { id: string; firstName: string; lastName?: string | null };
type Member = { id: number; firstName: string; lastName?: string | null };

type ShiftModalProps  = {
    user: User;
    shift: Shift;
    workspaceId: Number | null;
    isVisiable: boolean;   
    onDelete?: (shiftId: number) => void | Promise<void>;
    setIsVisiable: React.Dispatch<React.SetStateAction<boolean>>;
    users: Member[] | [];
    onSuccess: () => void | Promise<void>; 
}



function ShiftModal({user, shift, onDelete, workspaceId, isVisiable, setIsVisiable, users, onSuccess} : ShiftModalProps) {
  const apiClient = useApiClient(); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [date, setDate] = useState<Dayjs | null>(dayjs(shift.startTime));
  const [err, setErr] = useState<String | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs(shift.startTime),
    dayjs(shift.endTime),
  ]);
  
  const [editPayload, setEditPayload] = useState({
    userId: String(user.id),
    breakDuration: shift.breakDuration,
  });



  const editShift = async () => {
    try {
      if (!date || !timeRange) return;
      const [startT, endT] = timeRange;

      const start = date
        .hour(startT.hour())
        .minute(startT.minute())
        .second(startT.second())
        .millisecond(startT.millisecond());

      const end = date
        .hour(endT.hour())
        .minute(endT.minute())
        .second(endT.second())
        .millisecond(endT.millisecond());

      const payload = {
        ...editPayload,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };

      setIsLoading(true);
      await apiClient.updateShift(workspaceId, shift.id, payload);
      await onSuccess();
      resetEditState();
      setIsVisiable(false);
      setIsEditing(false);  
      setIsLoading(false);
    } catch (error) {

     let message = 'Failed to update shift'
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message)
          message = parsed.error ?? parsed.message ?? message
        } catch {
          message = error.message || message
        }
      } else if (typeof error === 'string') {
        message = error
      }
      setErr(message)
      setErr(String(error)); 
    } finally {
      setIsLoading(false); 
    }
    
  };

  const onCancel = () => {
    setIsVisiable(false);
    setErr(undefined); 
    setIsEditing(false);
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

  const resetEditState = () => {
    setDate(dayjs(shift.startTime));
    setTimeRange([dayjs(shift.startTime), dayjs(shift.endTime)]);
    setEditPayload({
      userId: String(user.id),
      breakDuration: shift.breakDuration,
    });
  };

  useEffect(() => {
    setDate(dayjs(shift.startTime))
    setTimeRange([dayjs(shift.startTime), dayjs(shift.endTime)])
    setEditPayload({
      userId: String(user.id),
      breakDuration: shift.breakDuration,
    })
    setErr('')
  }, [shift, user.id])

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
          {err && ( 
          <Alert 
            message={"Was unable to update shift"}
            showIcon
            type='error'
            closable
            onClose={() => setErr(undefined)}
          />)}

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
                  {isEditing ? ( 
                <Select
                  showSearch
                  value={editPayload.userId}
                  style={{ width: 200 }}
                  placeholder="Select Employee"
                  onChange={(value) => setEditPayload((prev) => ({...prev, userId: value}))}
                  options={users?.map((user: { id: any; firstName: any; }) => ({
                  value: String(user.id),
                  label: user.firstName,
                })) ?? []}
                allowClear
              />) : 
              (
                <span className='text-lg font-semibold'>
                    {user.firstName}{" "}{user.lastName}
                </span>
              )}
                  
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
                  {isEditing ? (
                    <DatePicker
                    value={date}
                    format="YYYY-MM-DD"
                    onChange={d => setDate(d)} 
                    />
                  ) : (
                    <span className='text-lg font-semibold'>
                    {formatLongDate(shift.startTime)}
                  </span>
                  )}
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
                  {isEditing ? (
                    <TimePicker.RangePicker 
                    format="HH:mm"
                    value={timeRange}
                    onChange={vals => setTimeRange(vals as [Dayjs, Dayjs] | null)}
                    />
                  ) : (
                  <span className='text-lg font-semibold'>
                    {formatTimeRange(shift.startTime, shift.endTime)}
                  </span>
                  )}
                  
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
              {isEditing ? (
                <>
              <Button className='flex-1'  style={{minHeight:"40px"}} onClick={() => {
                setIsEditing(false)
                resetEditState();
              }}>

                <div className='flex flex-row items-center gap-1 justify-center'>
                    <span className='font-semibold'>Cancel</span>
                </div>
              </Button>
            
            <Button className='flex-1' color="cyan" variant='solid' style={{minHeight:"40px"}} onClick={editShift} loading={isLoading}>
                <div className='flex flex-row items-center gap-1'>
                  <span className='font-semibold'>Submit</span>
                  <Send size={18}/>
                </div>
            </Button>
                    
                </>
              ) : (
                <>
            <Button className='flex-1' color='red' variant='solid' style={{minHeight:"40px"}} onClick={() => {setOpenModal(true)}}>
                <div className='flex flex-row items-center gap-1 justify-center'>
                    <Trash size={18}/>
                    <span className='font-semibold'>Delete</span>
                </div>
            </Button>
            
            <Button className='flex-1' variant="outlined" color='blue' style={{minHeight:"40px"}} onClick={() => setIsEditing(!isEditing)}>
                <div className='flex flex-row items-center gap-1'>
                    <Edit size={18}/>
                    <span className='font-semibold'>Edit</span>
                </div>
            </Button>
                </>
              )}
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

                <Button type='primary' className='flex-1' danger onClick={deleteShift} loading={isLoading}>
                  <span className='font-bold'>Delete</span>
                </Button>
              </div>
            </div>
        </Modal>
    </Modal>
  )
}

export default ShiftModal