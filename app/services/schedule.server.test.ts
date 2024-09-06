import { afterAll, beforeAll, describe, expect, it, test, vi } from 'vitest'
import { createMonthlySchedule, createWeeklySchedule, TDay } from './schedule.server'
import { faker } from '@faker-js/faker'
import { addDays, addMonths } from 'date-fns'

// Mock the current date for consistent testing
const mockDate = (dateString: string) => {
  vi.setSystemTime(new Date(dateString));
};

test("scheduleType=oneDay nonrepetive dates should return one schedule", () => {
  const randomDate = faker.date.recent()
  randomDate.setUTCHours(0, 0, 0, 0)
  const isoRandomDate = randomDate.toISOString()
  const schedules = createMonthlySchedule(isoRandomDate, false)
  expect(schedules[0].toISOString()).toBe(isoRandomDate)
})

test("scheduleType=oneDay repetive dates should return 12 schedule", () => {
  const randomDate = faker.date.recent()
  randomDate.setUTCHours(0, 0, 0, 0)
  const isoRandomDate = randomDate.toISOString()
  const schedules = createMonthlySchedule(isoRandomDate, true)
  expect(schedules.length).toBe(12)
  schedules.forEach((schedule, index) => {
    expect(schedule.toISOString()).toBe(addMonths(new Date(isoRandomDate), index).toISOString())
  })
})

describe("createWeeklySchedule", () => {
  beforeAll(() => {
    mockDate("2024-09-04T00:00:00Z"); // Set the current date to a Wednesday (Sept 4, 2024)
  });

  afterAll(() => {
    vi.useRealTimers(); // Restore original timer after tests
  });

  it("should return the next occurrence of a single day (non-repetitive)", () => {
    const result = createWeeklySchedule(["sunday"], false);
    expect(result).toHaveLength(1);
    expect(result[0].toISOString()).toBe("2024-09-08T00:00:00.000Z"); // Next Sunday
  });

  it("should return the next occurrences for multiple days (non-repetitive)", () => {
    const result = createWeeklySchedule(["sunday", "wednesday", "friday"], false);
    expect(result).toHaveLength(3);
    expect(result[0].toISOString()).toBe("2024-09-08T00:00:00.000Z"); // Next Sunday
    expect(result[1].toISOString()).toBe("2024-09-04T00:00:00.000Z"); // Same Wednesday
    expect(result[2].toISOString()).toBe("2024-09-06T00:00:00.000Z"); // Next Friday
  });

  it("should return the next 52 occurrences for a single day (repetitive)", () => {
    const result = createWeeklySchedule(["monday"], true);
    expect(result).toHaveLength(52);
    expect(result[0].toISOString()).toBe("2024-09-09T00:00:00.000Z"); // Next Monday
    expect(result[51].toISOString()).toBe("2025-09-01T00:00:00.000Z"); // 52nd Monday
  });


  it("should return the next 52 occurrences for multiple days (repetitive)", () => {
    const result = createWeeklySchedule(["monday", "friday"], true);
    expect(result).toHaveLength(104); // 52 weeks for each day
    // Next Friday (Today is Wednesday) and friday comes before monday
    expect(result[0].toISOString()).toBe("2024-09-06T00:00:00.000Z");
    expect(result[1].toISOString()).toBe("2024-09-09T00:00:00.000Z"); // Next Monday
    expect(result[103].toISOString()).toBe("2025-09-01T00:00:00.000Z"); // 52nd Monday
  });

  it("should handle a day that occurs after today", () => {
    const result = createWeeklySchedule(["friday"], false);
    expect(result).toHaveLength(1);
    expect(result[0].toISOString()).toBe("2024-09-06T00:00:00.000Z"); // Next Friday
  });


  it("should handle the case when the selected day is today", () => {
    const result = createWeeklySchedule(["wednesday"], false);
    expect(result).toHaveLength(1);
    expect(result[0].toISOString()).toBe("2024-09-04T00:00:00.000Z"); // Today is Wednesday
  });
});

