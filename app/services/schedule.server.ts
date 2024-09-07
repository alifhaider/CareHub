import { add, getDay, addMonths, addWeeks } from 'date-fns'
import { DAYS } from '~/routes/add.schedule'

export function createMonthlySchedule(
  date: string,
  isRepetitiveMonth: boolean,
) {
  const scheduleDate = new Date(date)
  scheduleDate.setUTCHours(0, 0, 0, 0)
  if (!isRepetitiveMonth) return [scheduleDate]

  return Array.from({ length: 12 }, (_, i) => addMonths(scheduleDate, i))
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

export type TDay = (typeof DAYS)[number]

export function createWeeklySchedule(days: TDay[], isRepetitiveWeek: boolean) {
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
    return nextDate
  })

  if (!isRepetitiveWeek) return nextOccurrences

  // Generate the next 52 occurrences for each selected day
  const occurrences = days.flatMap(day => {
    const targetDayIndex = getDayByNumber(day)
    return Array.from({ length: 52 }, (_, week) => {
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
