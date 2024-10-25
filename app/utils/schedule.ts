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
  serialFee: number | null
  discountFee: number | null
  visitFee: number | null
}

const isValidTime = (time: string): boolean => {
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

    const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
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

  const today = isToday(scheduleDate)

  // Extract hours and minutes from startTime and endTime
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  // Create date objects for start and end times on the same day
  const start = new Date(scheduleDate)
  start.setHours(startHour, startMinute)

  const end = new Date(scheduleDate)
  end.setHours(endHour, endMinute)

  // Check if the current time is within the schedule's time range
  const isWithinTimeRange = currentTime >= start && currentTime <= end

  // If today and within the time range, return "Today"
  if (today && isWithinTimeRange) {
    return 'Today'
  }

  // Otherwise, return the time difference using formatDistance
  return formatDistance(scheduleDate, currentTime, { addSuffix: true })
}
