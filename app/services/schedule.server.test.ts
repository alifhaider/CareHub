import { afterAll, beforeAll, describe, expect, it, test, vi } from 'vitest'
import {
  checkOverlapSchedule,
  getMonthlyScheduleDates,
  getWeeklyScheduleDates,
  ScheduleFormData,
  TSchedule,
} from './schedule.server'
import { faker } from '@faker-js/faker'
import { addMonths } from 'date-fns'

// Mock the current date for consistent testing
const mockDate = (dateString: string) => {
  vi.setSystemTime(new Date(dateString))
}

test('scheduleType=oneDay nonrepetive dates should return one schedule', () => {
  const randomDate = faker.date.recent()
  randomDate.setUTCHours(0, 0, 0, 0)
  const isoRandomDate = randomDate.toISOString()
  const schedules = getMonthlyScheduleDates(randomDate, false)
  expect(schedules[0].toISOString()).toBe(isoRandomDate)
})

test('scheduleType=oneDay repetive dates should return 12 schedule', () => {
  const randomDate = faker.date.recent()
  randomDate.setUTCHours(0, 0, 0, 0)
  const isoRandomDate = randomDate.toISOString()
  const schedules = getMonthlyScheduleDates(randomDate, true)
  expect(schedules.length).toBe(12)
  schedules.forEach((schedule, index) => {
    expect(schedule.toISOString()).toBe(
      addMonths(new Date(isoRandomDate), index).toISOString(),
    )
  })
})

describe('getWeeklyScheduleDates', () => {
  beforeAll(() => {
    mockDate('2024-09-04T00:00:00Z') // Set the current date to a Wednesday (Sept 4, 2024)
  })

  afterAll(() => {
    vi.useRealTimers() // Restore original timer after tests
  })

  it('should return the next occurrence of a single day (non-repetitive)', () => {
    const result = getWeeklyScheduleDates(['sunday'], false)
    expect(result).toHaveLength(1)
    expect(result[0].toISOString()).toBe('2024-09-08T00:00:00.000Z') // Next Sunday
  })

  it('should return the next occurrences for multiple days (non-repetitive)', () => {
    const result = getWeeklyScheduleDates(
      ['sunday', 'wednesday', 'friday'],
      false,
    )
    expect(result).toHaveLength(3)
    expect(result[0].toISOString()).toBe('2024-09-08T00:00:00.000Z') // Next Sunday
    expect(result[1].toISOString()).toBe('2024-09-04T00:00:00.000Z') // Same Wednesday
    expect(result[2].toISOString()).toBe('2024-09-06T00:00:00.000Z') // Next Friday
  })

  it('should return the next 52 occurrences for a single day (repetitive)', () => {
    const result = getWeeklyScheduleDates(['monday'], true)
    expect(result).toHaveLength(52)
    expect(result[0].toISOString()).toBe('2024-09-09T00:00:00.000Z') // Next Monday
    expect(result[51].toISOString()).toBe('2025-09-01T00:00:00.000Z') // 52nd Monday
  })

  it('should return the next 52 occurrences for multiple days (repetitive)', () => {
    const result = getWeeklyScheduleDates(['monday', 'friday'], true)
    expect(result).toHaveLength(104) // 52 weeks for each day
    // Next Friday (Today is Wednesday) and friday comes before monday
    expect(result[0].toISOString()).toBe('2024-09-06T00:00:00.000Z')
    expect(result[1].toISOString()).toBe('2024-09-09T00:00:00.000Z') // Next Monday
    expect(result[103].toISOString()).toBe('2025-09-01T00:00:00.000Z') // 52nd Monday
  })

  it('should handle a day that occurs after today', () => {
    const result = getWeeklyScheduleDates(['friday'], false)
    expect(result).toHaveLength(1)
    expect(result[0].toISOString()).toBe('2024-09-06T00:00:00.000Z') // Next Friday
  })

  it('should handle the case when the selected day is today', () => {
    const result = getWeeklyScheduleDates(['wednesday'], false)
    expect(result).toHaveLength(1)
    expect(result[0].toISOString()).toBe('2024-09-04T00:00:00.000Z') // Today is Wednesday
  })
})

describe('checkOverlapSchedule', () => {
  it('should return false when no schedules exist', () => {
    const scheduleDates = [new Date('2024-09-10')]
    const schedules: TSchedule[] = []
    const formData: ScheduleFormData = {
      startTime: '10:00',
      endTime: '11:00',
    }

    const result = checkOverlapSchedule(scheduleDates, schedules, formData)
    expect(result).toEqual([false])
  })

  it('should return true for exact overlap', () => {
    const scheduleDates = [new Date('2024-09-10')]
    const schedules: TSchedule[] = [
      { date: new Date('2024-09-10'), startTime: '10:00', endTime: '11:00' },
    ]
    const formData: ScheduleFormData = {
      startTime: '10:00',
      endTime: '11:00',
    }

    const result = checkOverlapSchedule(scheduleDates, schedules, formData)
    expect(result).toEqual([true])
  })

  it('should return true for partial overlap (form time starts during schedule)', () => {
    const scheduleDates = [new Date('2024-09-10')]
    const schedules: TSchedule[] = [
      { date: new Date('2024-09-10'), startTime: '10:00', endTime: '11:00' },
    ]
    const formData: ScheduleFormData = {
      startTime: '10:30',
      endTime: '11:30',
    }

    const result = checkOverlapSchedule(scheduleDates, schedules, formData)
    expect(result).toEqual([true])
  })

  it('should return true for partial overlap (form time ends during schedule)', () => {
    const scheduleDates = [new Date('2024-09-10')]
    const schedules: TSchedule[] = [
      { date: new Date('2024-09-10'), startTime: '10:00', endTime: '11:00' },
    ]
    const formData: ScheduleFormData = {
      startTime: '09:30',
      endTime: '10:30',
    }

    const result = checkOverlapSchedule(scheduleDates, schedules, formData)
    expect(result).toEqual([true])
  })

  it('should return true for full containment overlap (form time fully within schedule)', () => {
    const scheduleDates = [new Date('2024-09-10')]
    const schedules: TSchedule[] = [
      { date: new Date('2024-09-10'), startTime: '10:00', endTime: '12:00' },
    ]
    const formData: ScheduleFormData = {
      startTime: '10:30',
      endTime: '11:00',
    }

    const result = checkOverlapSchedule(scheduleDates, schedules, formData)
    expect(result).toEqual([true])
  })

  it('should return false when no overlap', () => {
    const scheduleDates = [new Date('2024-09-10')]
    const schedules: TSchedule[] = [
      { date: new Date('2024-09-10'), startTime: '12:00', endTime: '13:00' },
    ]
    const formData: ScheduleFormData = {
      startTime: '10:00',
      endTime: '11:00',
    }

    const result = checkOverlapSchedule(scheduleDates, schedules, formData)
    expect(result).toEqual([false])
  })

  it('should return false when form schedule is completely before any existing schedules', () => {
    const scheduleDates = [new Date('2024-09-10')]
    const schedules: TSchedule[] = [
      { date: new Date('2024-09-10'), startTime: '12:00', endTime: '13:00' },
    ]
    const formData: ScheduleFormData = {
      startTime: '09:00',
      endTime: '10:00',
    }

    const result = checkOverlapSchedule(scheduleDates, schedules, formData)
    expect(result).toEqual([false])
  })

  it('should handle multiple dates correctly', () => {
    const scheduleDates = [new Date('2024-09-10'), new Date('2024-09-11')]
    const schedules: TSchedule[] = [
      { date: new Date('2024-09-10'), startTime: '10:00', endTime: '11:00' },
      { date: new Date('2024-09-11'), startTime: '10:00', endTime: '11:00' },
    ]
    const formData: ScheduleFormData = {
      startTime: '10:30',
      endTime: '11:30',
    }

    const result = checkOverlapSchedule(scheduleDates, schedules, formData)
    expect(result).toEqual([true, true])
  })

  it('should handle edge case when schedule and form times are exactly adjacent', () => {
    const scheduleDates = [new Date('2024-09-10')]
    const schedules: TSchedule[] = [
      { date: new Date('2024-09-10'), startTime: '11:00', endTime: '12:00' },
    ]
    const formData: ScheduleFormData = {
      startTime: '10:00',
      endTime: '11:00',
    }

    const result = checkOverlapSchedule(scheduleDates, schedules, formData)
    expect(result).toEqual([true])
  })
})
