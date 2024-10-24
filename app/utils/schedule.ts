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

function isValidTime(time: string) {
  return time.trim().match(/^\d{1,2}:\d{1,2}$/)
}

function isValidDate(date: string) {
  return date.trim().match(/^\d{4}-\d{2}-\d{2}$/)
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
    return isNaN(date.getTime()) ? null : date
  }

  const isEndTimePassed = (schedule: TSchedule): boolean => {
    const scheduleDate = normalizeDate(schedule.date)
    if (!scheduleDate || !isValidTime(schedule.endTime)) return true

    const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
    const scheduleEndTime = new Date(scheduleDate)
    scheduleEndTime.setHours(endHour, endMinute)

    return now > scheduleEndTime // Check if the current time is after the schedule's end time
  }

  // Filter out schedules whose end times have passed and that are in the future
  const upcomingSchedules = schedules.filter(schedule => {
    if (
      !isValidDate(schedule.date) ||
      !isValidTime(schedule.startTime) ||
      !isValidTime(schedule.endTime)
    )
      return false
    const scheduleDate = normalizeDate(schedule.date)
    return scheduleDate && scheduleDate >= today && !isEndTimePassed(schedule)
  })

  // Sort by date and time
  upcomingSchedules.sort((a, b) => {
    const aDate = normalizeDate(a.date)!
    const bDate = normalizeDate(b.date)!

    if (aDate.getTime() !== bDate.getTime()) {
      return aDate.getTime() - bDate.getTime() // Sort by date
    }

    // If dates are the same, sort by start time
    const [aStartHour, aStartMinute] = a.startTime.split(':').map(Number)
    const [bStartHour, bStartMinute] = b.startTime.split(':').map(Number)

    if (aStartHour !== bStartHour) {
      return aStartHour - bStartHour
    }
    return aStartMinute - bStartMinute
  })

  if (upcomingSchedules.length === 0) {
    return []
  }

  // Get the nearest upcoming date
  const nearestDay = normalizeDate(upcomingSchedules[0].date)!

  // Return only schedules for that nearest day
  return upcomingSchedules.filter(
    schedule =>
      normalizeDate(schedule.date)!.toDateString() ===
      nearestDay.toDateString(),
  )
}

export function getFormattedTimeDifference(
  date: string,
  startTime: string,
  endTime: string,
) {
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
