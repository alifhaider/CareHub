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

// returns schedules for the upcoming day
export function getUpcomingDateSchedules(schedules: TSchedule[]): TSchedule[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of the day

  const normalizeDate = (
    dateString: string,
    startTime: string,
    endTime: string,
  ) => {
    if (!dateString || !isValidTime(startTime) || !isValidTime(endTime))
      return ''
    const date = dateString.split('T')[0]
    if (!isValidDate(date)) return ''
    return new Date(date).toISOString().split('T')[0] // returns the date part
  }

  const isEndTimePassed = (schedule: TSchedule) => {
    if (
      !isValidTime(schedule.endTime) ||
      !isValidDate(schedule.date) ||
      !isValidTime(schedule.startTime)
    )
      return true
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
    const scheduleEndTime = new Date(schedule.date)
    scheduleEndTime.setHours(endHour, endMinute)

    return new Date() > scheduleEndTime // Check if current time is after the schedule's end time
  }

  // Find the nearest upcoming schedule day
  const upcomingDays = schedules
    .map(schedule =>
      normalizeDate(schedule.date, schedule.startTime, schedule.endTime),
    )
    .filter(day => new Date(day) >= today) // Filter future dates
    .sort() // Automatically sorts strings in ascending order

  // Filter today's schedules and check if any of them are still valid (i.e., endTime hasn't passed)
  const todaySchedules = schedules.filter(
    schedule =>
      normalizeDate(schedule.date, schedule.startTime, schedule.endTime) ===
        normalizeDate(
          today.toISOString(),
          today.getHours().toString(),
          today.getMinutes().toString(),
        ) && !isEndTimePassed(schedule),
  )

  console.log('todaySchedules', todaySchedules)

  // If there are valid schedules for today, return them
  if (todaySchedules.length > 0) {
    return todaySchedules
  }

  // If no valid schedules for today, find the next available day
  const nearestDay = upcomingDays.find(day => new Date(day) > today)
  if (!nearestDay) return [] // No upcoming schedules

  // Filter schedules for the nearest day
  const nextDaySchedules = schedules.filter(
    schedule =>
      normalizeDate(schedule.date, schedule.startTime, schedule.endTime) ===
      nearestDay,
  )
  return nextDaySchedules
}

export function getFormattedTimeDifference(
  date: string,
  startTime: string,
  endTime: string,
) {
  const scheduleDate = new Date(date)
  const currentTime = new Date()

  // Check if the date is today
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
