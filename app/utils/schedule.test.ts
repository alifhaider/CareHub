import { describe, it, expect } from 'vitest'
import {
  formatTime,
  getFormattedTimeDifference,
  getUpcomingDateSchedules,
} from './schedule'
import { parse, format } from 'date-fns'

const sampleLocation = {
  location: {
    id: '1',
    name: 'Location 1',
    address: 'Address 1',
    city: 'City 1',
    state: 'State 1',
    zip: 'Zip 1',
  },
}
const sampleFee = {
  serialFee: 100,
  discountFee: 90,
  visitFee: 80,
}

const pastSchedules = [
  {
    id: '1',
    date: new Date(new Date().getTime() - 86400000).toISOString(), // Yesterday
    startTime: '08:00',
    endTime: '10:00',
    ...sampleLocation,
    ...sampleFee,
  },
  {
    id: '2',
    date: new Date(new Date().getTime() - 172800000).toISOString(), // day before yesterday
    startTime: '14:00',
    endTime: '16:00',
    ...sampleLocation,
    ...sampleFee,
  },
]
const today = new Date()
today.setHours(0, 0, 0, 0)
const todayString = today.toISOString()

const todaySchedulesWithPassedEndTime = [
  {
    id: '3',
    date: todayString,
    startTime: `${today.getHours() - 2}:${today.getMinutes()}`,
    endTime: `${today.getHours() - 1}:${today.getMinutes()}`,
    ...sampleLocation,
    ...sampleFee,
  },
  {
    id: '4',
    date: todayString,
    startTime: `${today.getHours() - 4}:${today.getMinutes()}`,
    endTime: `${today.getHours() - 3}:${today.getMinutes()}`,
    ...sampleLocation,
    ...sampleFee,
  },
]

const futureFirstSchedule = {
  id: '5',
  date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], // Tomorrow
  startTime: '09:00',
  endTime: '11:00',
  ...sampleLocation,
  ...sampleFee,
}

const futureSecondSchedule = {
  id: '6',
  date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], // Tomorrow
  startTime: '14:00',
  endTime: '16:00',
  ...sampleLocation,
  ...sampleFee,
}

const upcomingSameDaySchedules = [futureFirstSchedule, futureSecondSchedule]
const dayAfterTomorrowSchedule = {
  id: '7',
  date: new Date(today.getTime() + 172800000).toISOString().split('T')[0], // Day after tomorrow
  startTime: '09:00',
  endTime: '11:00',
  ...sampleLocation,
  ...sampleFee,
}

const futureSchedules = [...upcomingSameDaySchedules, dayAfterTomorrowSchedule]

const futureUnSortedSchedules = [
  dayAfterTomorrowSchedule,
  ...upcomingSameDaySchedules,
]

const invalidDateSchedules = [
  {
    id: '8',
    date: 'invalid-date',
    startTime: '09:00',
    endTime: '11:00',
    ...sampleLocation,
    ...sampleFee,
  },
]

describe('formatTime', () => {
  it('should return formatted time in hh:mm a format', () => {
    const result = formatTime('14:30')
    expect(result).toBe('02:30 PM')
  })

  it('should handle edge cases like invalid time', () => {
    const result = formatTime('invalid-time')
    expect(result).toBe('') // Should return an empty string
  })

  it('should return an empty string for undefined input', () => {
    const result = formatTime(undefined)
    expect(result).toBe('')
  })

  it('should return an empty string for an empty string input', () => {
    const result = formatTime('')
    expect(result).toBe('')
  })

  it('should handle time with leading or trailing spaces', () => {
    const result = formatTime(' 14:30 ')
    expect(result).toBe('02:30 PM')
  })
})

describe('getUpcomingDateSchedules', () => {
  it('should return the future schedules if only future schedules are provided', () => {
    const result = getUpcomingDateSchedules(futureSchedules)
    expect(result).toEqual(upcomingSameDaySchedules) // All future schedules
  })

  it('should return an empty array if all schedules are in the past', () => {
    const result = getUpcomingDateSchedules(pastSchedules)
    expect(result).toEqual([]) // No upcoming schedules
  })

  // fix this
  it('should skip schedules with no date but valid time', () => {
    const result = getUpcomingDateSchedules([
      ...pastSchedules,
      ...invalidDateSchedules,
    ])

    expect(result).toEqual([]) // Today’s schedules
  })

  it('should return an empty array if no schedules are provided', () => {
    const result = getUpcomingDateSchedules([])
    expect(result).toEqual([]) // No schedules
  })

  it('should return an empty array of schedules if invalid time is provided', () => {
    const result = getUpcomingDateSchedules([
      {
        id: '1',
        date: new Date().toISOString(),
        startTime: 'invalid-time',
        endTime: '11:00',
        ...sampleLocation,
        ...sampleFee,
      },
    ])
    expect(result).toEqual([]) // No schedules
  })

  it(`should return next day schedules if today’s schedules are passed their end time`, () => {
    const result = getUpcomingDateSchedules([
      ...todaySchedulesWithPassedEndTime,
      ...futureSchedules,
    ])
    expect(result).toEqual(upcomingSameDaySchedules) // Tomorrow’s schedules
  })

  it('should return sorted schedules by time', () => {
    const result = getUpcomingDateSchedules([
      futureSecondSchedule,
      futureFirstSchedule,
    ])
    expect(result).toEqual([futureFirstSchedule, futureSecondSchedule])
  })

  it('should return sorted schedules by date', () => {
    const result = getUpcomingDateSchedules(futureUnSortedSchedules)
    expect(result).toEqual(upcomingSameDaySchedules)
  })

  // TODO: Apply changes to the function to make this test pass
  // it('should return  the future schedules of the same day if passed and future schedules are provided', () => {
  //   const result = getUpcomingDateSchedules([
  //     ...todaySchedulesWithPassedEndTime,
  //     ...todaySchedulesInFutureTime,
  //   ])
  //   expect(result).toEqual(todaySchedulesInFutureTime) // Today’s schedules
  // })
})
