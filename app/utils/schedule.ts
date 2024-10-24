import { parse, format } from 'date-fns'

export type TSchedule = {
  id: string
  date: string
  startTime: string
  endTime: string
  location: {
    id: string
    name: string
    address: string
    city: string
    state: string | null
    zip: string | null
  }
  serialFee: number | null
  discountFee: number | null
  visitFee: number | null
}

// time is a string in the format "2: 14" or "14: 00"
// should return 02:14 AM or 02:14 PM
// handle edge cases like invalid time
export function formatTime(time?: string) {
  if (!time) return ''
  if (!time.trim().match(/^\d{1,2}:\d{2}$/)) return ''
  const parsedTime = parse(time.trim(), 'H:mm', new Date())
  return format(parsedTime, 'hh:mm a')
}

export function getUpcomingDateSchedules(schedules: TSchedule[]): TSchedule[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of the day
  const normalizeDate = (date: string) => {
    if (!date) return ''
    // if (!date.trim().match(/^\d{4}-\d{2}-\d{2}$/)) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  // Find the nearest upcoming schedule day
  const upcomingDays = schedules
    .map(schedule => normalizeDate(schedule.date))
    .filter(day => new Date(day) >= today) // Filter future dates
    .sort() // Automatically sorts strings in ascending order

  const nearestDay = upcomingDays[0]

  // Filter schedules for the nearest day
  const nextDaySchedules = schedules.filter(
    schedule => normalizeDate(schedule.date) === nearestDay,
  )
  return nextDaySchedules
}
