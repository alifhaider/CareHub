import { parse, format, isToday, formatDistance } from 'date-fns'

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
  _count: {
    bookings: number
  }
  serialFee: number | null
  discountFee: number | null
  visitFee: number | null
}

const isValidTime = (time: string): boolean => {
  if (!time) return false
  const [hour, minute] = time.split(':').map(Number)
  return (
    !isNaN(hour) &&
    !isNaN(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  )
}

const isValidDate = (date: string): boolean => {
  return !isNaN(new Date(date).getTime())
}

// get a time string like 9:20 and return 09:20
export function formatTimeToTwoDigits(time: string): string {
  const [hour, minute] = getHoursAndMinutes(time)
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

// time is a string in the format "2: 14" or "14: 00"
// should return 02:14 AM or 02:14 PM
// handle edge cases like invalid time
export function formatTime(time?: string) {
  if (!time) return ''
  if (!isValidTime(time)) return ''
  const parsedTime = parse(time.trim(), 'H:mm', new Date())
  return format(parsedTime, 'hh:mm a')
}

export function getUpcomingDateSchedules(schedules: TSchedule[]): TSchedule[] {
  const now = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of the day

  const normalizeDate = (dateString: string): Date | null => {
    const date = new Date(dateString)
    return isValidDate(dateString) ? date : null
  }

  const isScheduleValid = (schedule: TSchedule): boolean => {
    const scheduleDate = normalizeDate(schedule.date)
    if (
      !scheduleDate ||
      !isValidTime(schedule.startTime) ||
      !isValidTime(schedule.endTime)
    )
      return false

    const [endHour, endMinute] = getHoursAndMinutes(schedule.endTime)
    const scheduleEndTime = new Date(scheduleDate)
    scheduleEndTime.setHours(endHour, endMinute)

    return scheduleDate >= today && now <= scheduleEndTime
  }

  const upcomingSchedules = schedules.filter(isScheduleValid).sort((a, b) => {
    const aDate = normalizeDate(a.date)!
    const bDate = normalizeDate(b.date)!

    if (aDate.getTime() !== bDate.getTime()) {
      return aDate.getTime() - bDate.getTime() // Sort by date
    }

    // If dates are the same, sort by start time
    return a.startTime.localeCompare(b.startTime)
  })

  if (upcomingSchedules.length === 0) {
    return []
  }

  const nearestDay = normalizeDate(upcomingSchedules[0].date)!.toDateString()

  return upcomingSchedules.filter(
    schedule => normalizeDate(schedule.date)!.toDateString() === nearestDay,
  )
}

// since `getUpcomingDateSchedules` doesn't return the schedules which are in the past
// even if just 1 minute has passed, it returns the next day schedule
// So, in this function, we calculate the time difference between the schedule date and the current time
// If the schedule date is today, return "Today"

export function getFormattedTimeDifference(
  date: string,
  startTime: string,
  endTime: string,
) {
  if (!isValidDate(date) || !isValidTime(startTime) || !isValidTime(endTime)) {
    return ''
  }

  const scheduleDate = new Date(date)
  const currentTime = new Date()

  // Extract hours and minutes from startTime and endTime
  const [startHour, startMinute] = getHoursAndMinutes(startTime)
  const [endHour, endMinute] = getHoursAndMinutes(endTime)

  // Create date objects for start and end times on the same day
  const start = new Date(scheduleDate)
  start.setHours(startHour, startMinute)

  const end = new Date(scheduleDate)
  end.setHours(endHour, endMinute)

  // Check if the schedule date is today (ignoring time range)
  if (isToday(scheduleDate)) {
    return 'Today'
  }

  // If not today, return the time difference (e.g., "in 14 hours", "3 days ago")
  return formatDistance(scheduleDate, currentTime, { addSuffix: true })
}

// takes a time string like "2: 14" or "14: 00" and returns { hour: 2, minute: 14 }
export function getHoursAndMinutes(time: string) {
  if (!isValidTime(time)) return [0, 0]
  const [hour, minute] = time.split(':').map(Number)
  return [hour, minute]
}
