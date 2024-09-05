import { addMonths } from "date-fns"

function createMonthlySchedule(date: string, isRepetiveMonth: boolean) {
  const schedules = []
  let scheduleDate = new Date(date)

  for (let i = 0; i < 12; i++) {
    schedules.push(scheduleDate)
  }
  scheduleDate = addMonths(scheduleDate, 1)
  return schedules
}