"use client";

import { MoreHorizontal, Calendar } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@clerk/nextjs"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useApiClient } from "@/hooks/useApiClient"
import { format, startOfWeek, endOfWeek, isToday, isTomorrow, parseISO } from "date-fns"
import type { Shift } from "@scrubin/schemas"

export default function UpcomingScheduleCard() {
  const { userId } = useAuth()
  const { id: workspaceId } = useParams<{ id: string }>()
  const apiClient = useApiClient()
  const [shifts, setShifts] = useState<Array<{
    id: string
    date: string
    time: string
    startTime: Date
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function fetchShifts() {
      if (!userId || !workspaceId) return

      try {
        setLoading(true)
        setError(null)

        // Get shifts for this week
        const now = new Date()
        const weekStart = startOfWeek(now, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
        
        // Add one week to get upcoming shifts
        weekEnd.setDate(weekEnd.getDate() + 7)

        const workspaceIdNum = Number(workspaceId)
        const response = await apiClient.getUserShifts(workspaceIdNum, userId, {
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
        }) as { shifts: Shift[] }

        if (!alive) return

        // Filter out shifts that have been clocked out
        const activeShifts = response.shifts.filter(shift => {
          return !shift.timesheet || !shift.timesheet.clockOutTime
        })

        // Extract and format shifts
        const userShifts: Array<{
          id: string
          date: string
          time: string
          startTime: Date
        }> = []

        for (const shift of activeShifts) {
          const startTime = parseISO(shift.startTime)
          const endTime = parseISO(shift.endTime)
          
          // Format date
          let dateLabel = format(startTime, "EEE, MMM d")
          if (isToday(startTime)) {
            dateLabel = "Today"
          } else if (isTomorrow(startTime)) {
            dateLabel = "Tomorrow"
          }

          // Format time
          const timeLabel = `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`

          userShifts.push({
            id: String(shift.id),
            date: dateLabel,
            time: timeLabel,
            startTime,
          })
        }

        // Sort by start time
        userShifts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

        setShifts(userShifts)
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : "Failed to load shifts")
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    fetchShifts()

    return () => {
      alive = false
    }
  }, [userId, workspaceId, apiClient])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
          <CardDescription>Loading shifts...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Week</CardTitle>
        <CardDescription>
          You have {shifts.length} upcoming shift{shifts.length !== 1 ? 's' : ''} scheduled.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming shifts scheduled for this week.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {shift.date}
                    </div>
                  </TableCell>
                  <TableCell>{shift.time}</TableCell>
                  <TableCell className="hidden md:table-cell">-</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Request Trade</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Request Time Off</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
