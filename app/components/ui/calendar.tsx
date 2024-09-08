import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, DayProps, useDayRender } from 'react-day-picker'

import { cn } from '~/lib/utils'
import { Button, buttonVariants } from '~/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>
type ScheduleTime = {
  id: string
  startTime: Date
  endTime: Date
  date: Date
}

type CustomCellProps = {
  scheduleTimes: ScheduleTime[] | undefined
  className?: string
}

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
        day_today: 'bg-accent text-accent-foreground',
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

export function CustomCell({
  className,
  scheduleTimes = [],
  ...props
}: CustomCellProps & DayProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const dayRender = useDayRender(props.date, props.displayMonth, buttonRef)
  const modifires = dayRender.activeModifiers

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
      'h-16 w-16 p-0 font-normal aria-selected:opacity-100',
    ),
    day_range_end: 'day-range-end',
    day_selected:
      'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
    day_today: 'bg-accent text-accent-foreground',
    day_outside:
      'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
    day_disabled:
      'text-muted-foreground opacity-50 cursor-not-allowed bg-transparent hover:bg-transparent',
    day_range_middle:
      'aria-selected:bg-accent aria-selected:text-accent-foreground',
    day_has_schedule: 'bg-primary text-primary-foreground',
    day_hidden: 'invisible',
  }

  if (dayRender.isHidden) {
    return <td className={cn(className, 'invisible')} {...props} />
  }

  if (!dayRender.isButton || currentDaySchedules.length <= 0) {
    return (
      <td
        className={cn(
          classNames.cell,
          classNames.day_disabled,
          modifires.isOutside && classNames.day_outside,
          modifires.isToday && classNames.day_today,
        )}
        {...props}
      >
        <div className={classNames.day}>{props.date.getDate()}</div>
      </td>
    )
  }

  return (
    <td
      className={cn(
        classNames.cell,
        modifires.isOutside && classNames.day_outside,
      )}
      {...props}
    >
      <Button
        ref={buttonRef}
        className={cn(
          classNames.day,
          modifires.isToday && classNames.day_today,
        )}
        {...dayRender.buttonProps}
      >
        {props.date.getDate()}
      </Button>
    </td>
  )
}

export { Calendar }
