import { Schedule } from '@prisma/client'
import { add, getDay, addMonths, addWeeks } from 'date-fns'
import { DAYS } from '~/routes/add.schedule'

export type ScheduleFormData = {
  startTime: string
  endTime: string
}
export type TDay = (typeof DAYS)[number]
export type TSchedule = Pick<Schedule, 'date' | 'startTime' | 'endTime'>

export const REPEAT_WEEKS = 52
export const REPEAT_MONTHS = 12

export function getMonthlyScheduleDates(
  date?: Date,
  isRepetitiveMonth?: boolean,
) {
  if (!date) return []
  const scheduleDate = new Date(date)
  scheduleDate.setUTCHours(0, 0, 0, 0)
  if (!isRepetitiveMonth) return [scheduleDate]

  return Array.from({ length: REPEAT_MONTHS }, (_, i) =>
    addMonths(scheduleDate, i),
  )
}

function getDayByNumber(day: (typeof DAYS)[number]) {
  const daysOfWeek = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  return daysOfWeek[day]
}

export function getWeeklyScheduleDates(
  days?: TDay[],
  isRepetitiveWeek?: boolean,
) {
  if (!days) return []
  const today = new Date()
  const currentDayIndex = getDay(today)

  // Calculate the next occurrence for each day
  const nextOccurrences = days.map(day => {
    const targetDayIndex = getDayByNumber(day)
    let daysUntilNextOccurrence = (targetDayIndex - currentDayIndex + 7) % 7
    if (daysUntilNextOccurrence === 0 && today.getDay() !== targetDayIndex) {
      daysUntilNextOccurrence = 7
    }
    const nextDate = add(today, { days: daysUntilNextOccurrence })
    nextDate.setUTCHours(0, 0, 0, 0)
    return nextDate
  })

  if (!isRepetitiveWeek) return nextOccurrences

  // Generate the next 52 occurrences for each selected day
  const occurrences = days.flatMap(day => {
    const targetDayIndex = getDayByNumber(day)
    return Array.from({ length: REPEAT_WEEKS }, (_, week) => {
      const baseDate = nextOccurrences.find(
        occurrence => getDay(occurrence) === targetDayIndex,
      )!
      // Calculate the occurrence date for this week + week offset
      return addWeeks(baseDate, week)
    })
  })

  // Sort occurrences by date to ensure they're in the correct order
  occurrences.sort((a, b) => a.getTime() - b.getTime())

  return occurrences
}

export function checkOverlapSchedule(
  scheduleDates: Date[],
  schedules: TSchedule[],
  data: ScheduleFormData,
) {
  return scheduleDates.map(date => {
    // Get the schedules for the current date
    const schedulesForDate = schedules.filter(schedule => {
      return (
        schedule.date.toISOString().slice(0, 10) ===
        new Date(date).toISOString().slice(0, 10)
      )
    })

    // Convert the times to Date objects for comparison
    const [formStartHour, formStartMin] = data.startTime.split(':').map(Number)
    const [formEndHour, formEndMin] = data.endTime.split(':').map(Number)

    // Create time objects with the correct day
    const formStartTime = new Date(
      new Date(date).setHours(formStartHour, formStartMin, 0, 0),
    )
    const formEndTime = new Date(
      new Date(date).setHours(formEndHour, formEndMin, 0, 0),
    )

    // Check for overlaps
    const isOverlapped = schedulesForDate.some(schedule => {
      const [scheduleStartHour, scheduleStartMin] = schedule.startTime
        .split(':')
        .map(Number)
      const [scheduleEndHour, scheduleEndMin] = schedule.endTime
        .split(':')
        .map(Number)

      const scheduleStartTime = new Date(
        new Date(schedule.date).setHours(
          scheduleStartHour,
          scheduleStartMin,
          0,
          0,
        ),
      )
      const scheduleEndTime = new Date(
        new Date(schedule.date).setHours(scheduleEndHour, scheduleEndMin, 0, 0),
      )

      return (
        (formStartTime >= scheduleStartTime &&
          formStartTime <= scheduleEndTime) || // Form start time overlaps
        (formEndTime >= scheduleStartTime && formEndTime <= scheduleEndTime) // Form end time overlaps
      )
    })

    return isOverlapped
  })
}
