import { Schedule } from '@prisma/client'
import { addMonths, addDays } from 'date-fns'
import { DAYS } from '~/routes/add.schedule'
import { getHoursAndMinutes } from '~/utils/schedule'

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

export function getWeeklyScheduleDates(daysArray?: TDay[], isRepetive = false) {
  if (!daysArray?.length) return []
  const today = new Date()
  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]

  // Function to find the next occurrences for a given weekday name
  const getOccurrences = (dayName: string) => {
    const dayIndex = dayNames.indexOf(dayName.toLocaleLowerCase())
    const occurrences = []
    let currentDate = today

    // Check if today matches the target day
    if (currentDate.getDay() === dayIndex) {
      occurrences.push(currentDate)
    }

    // Generate future occurrences
    const targetOccurrences = isRepetive ? REPEAT_WEEKS : 1
    while (occurrences.length < targetOccurrences) {
      currentDate = addDays(currentDate, 1)

      if (currentDate.getDay() === dayIndex) {
        occurrences.push(new Date(currentDate)) // Add occurrence
      }

      // Safety check to avoid infinite loop
      if (occurrences.length > 366) {
        console.error('Infinite loop detected')
        break
      }
    }

    return occurrences
  }

  // Generate all occurrences for the input days
  const allOccurrences = daysArray.flatMap(dayName => getOccurrences(dayName))

  // Remove duplicates, sort, and format the dates
  const uniqueDates = Array.from(
    new Set(allOccurrences.map(date => date.getTime())),
  )
    .sort((a, b) => a - b)
    .map(date => new Date(date))

  return uniqueDates
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
    const [formStartHour, formStartMin] = getHoursAndMinutes(data.startTime)
    const [formEndHour, formEndMin] = getHoursAndMinutes(data.endTime)

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
