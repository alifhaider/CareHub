import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, DayProps, useDayRender } from 'react-day-picker'

import { cn } from '~/lib/utils'
import { buttonVariants } from '~/components/ui/button'
import { Schedule } from '@prisma/client'
import { getHoursAndMinutes } from '~/utils/schedule'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-16 font-normal text-lg',
        row: 'flex w-full mt-2',
        cell: 'h-16 w-16 text-center text-2xl p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-16 w-16 p-0 font-normal aria-selected:opacity-100',
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground border border-brand',
        day_outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

type ScheduleTime = {
  id: string
  startTime: Schedule['startTime']
  endTime: Schedule['endTime']
  date: Schedule['date']
}

type CustomCellProps = {
  scheduleTimes: ScheduleTime[] | undefined
  className?: string
  highlightedDate?: Date
}

export const CustomCell = React.memo(function CustomCell({
  className,
  scheduleTimes = [],
  highlightedDate,
  ...props
}: CustomCellProps & DayProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const dayRender = useDayRender(props.date, props.displayMonth, buttonRef)
  const modifires = dayRender.activeModifiers

  const isToday = () => {
    const today = new Date()
    return (
      props.date.getDate() === today.getDate() &&
      props.date.getMonth() === today.getMonth() &&
      props.date.getFullYear() === today.getFullYear()
    )
  }

  // Helper to determine if a date is selected
  const isSelected = () => {
    return (
      highlightedDate &&
      props.date.getDate() === highlightedDate.getDate() &&
      props.date.getMonth() === highlightedDate.getMonth() &&
      props.date.getFullYear() === highlightedDate.getFullYear()
    )
  }

  // Helper to determine if a date has schedules
  const hasSchedule = () =>
    scheduleTimes.some(schedule => {
      const scheduleDate = new Date(schedule.date)
      return (
        props.date.getDate() === scheduleDate.getDate() &&
        props.date.getMonth() === scheduleDate.getMonth() &&
        props.date.getFullYear() === scheduleDate.getFullYear()
      )
    })

  const isPast = (schedule: ScheduleTime) => {
    const [endHours, endMinutes] = getHoursAndMinutes(schedule.endTime)
    const scheduleDate = new Date(schedule.date)
    scheduleDate.setHours(endHours, endMinutes)
    return schedule.date < new Date()
  }

  const isSameDay = (schedule: ScheduleTime) => {
    return (
      props.date.getDate() === schedule.date.getDate() &&
      props.date.getMonth() === schedule.date.getMonth() &&
      props.date.getFullYear() === schedule.date.getFullYear()
    )
  }

  const currentDaySchedules = scheduleTimes.filter(isSameDay)

  const classNames = {
    cell: 'h-16 w-16 text-center text-2xl p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
    day: cn(
      buttonVariants({ variant: 'ghost' }),
      'h-16 w-16 p-0 font-normal aria-selected:opacity-100 rounded-md ',
    ),
    day_range_end: 'day-range-end',
    day_selected: 'bg-brand text-primary rounded-md font-bold text-xl',
    day_today:
      'bg-accent text-accent-foreground rounded-md border border-brand',
    day_outside:
      'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
    day_disabled:
      'text-muted-foreground opacity-50 cursor-not-allowed bg-transparent hover:bg-transparent',
    day_range_middle:
      'aria-selected:bg-accent aria-selected:text-accent-foreground',
    day_has_schedule:
      'unset bg-primary text-brand hover:bg-primary hover:text-brand focus:bg-primary focus:text-brand font-bold text-xl rounded-md',
    day_hidden: 'invisible',
  }

  if (dayRender.isHidden) {
    return <td className={cn(className, 'invisible')} {...props} />
  }

  const isTodayFlag = isToday()

  if (!dayRender.isButton || currentDaySchedules.length <= 0) {
    return (
      <td
        {...props}
        className={cn(
          classNames.cell,
          classNames.day_disabled,
          modifires.isOutside && classNames.day_outside,
        )}
      >
        <div
          className={cn(classNames.day, isTodayFlag && classNames.day_today)}
        >
          {props.date.getDate()}
        </div>
      </td>
    )
  }

  const isDisabled = isPast(currentDaySchedules[0]) || !hasSchedule()

  return (
    <td
      {...props}
      className={cn(
        classNames.cell,
        modifires.isOutside && classNames.day_outside,
        isSelected() && classNames.day_selected, // Apply selected style first
        !isSelected() && modifires.schedules && classNames.day_has_schedule,
        isDisabled && classNames.day_disabled,
      )}
    >
      <button
        ref={buttonRef}
        {...dayRender.buttonProps}
        disabled={isDisabled}
        className={cn(
          classNames.cell,
          classNames.day,
          isTodayFlag && classNames.day_today,
          isSelected() && classNames.day_selected,
          !isSelected() && modifires.schedules && classNames.day_has_schedule,
          isDisabled && classNames.day_disabled,
        )}
      >
        {props.date.getDate()}
      </button>
    </td>
  )
})

export { Calendar }
