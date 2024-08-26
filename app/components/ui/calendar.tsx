import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, DayProps } from 'react-day-picker'

import { cn } from '~/lib/utils'
import { Button, buttonVariants } from '~/components/ui/button'
import { Schedule } from '@prisma/client'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

type CustomCellProps = {
  scheduleTimes: {
    id: string
    startTime: Date
    endTime: Date
  }[] | undefined
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
        head_cell:
          'text-muted-foreground rounded-md w-16 font-normal text-lg',
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
  const date = props.date.getDate()

  function getColor(index: number) {
    if (index === 0) return 'bg-lime-600'
    if (index === 1) return 'bg-yellow-500'
    if (index === 2) return 'bg-red-500'
    return 'bg-primary'
  }

  const isOutsideCurrentMonth = props.date.getMonth() !== props.displayMonth.getMonth();
  const dayHasSchedule = scheduleTimes.length > 0 && scheduleTimes[0].startTime.getDate() === date;


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
    day_disabled: 'text-muted-foreground opacity-50 cursor-not-allowed',
    day_range_middle:
      'aria-selected:bg-accent aria-selected:text-accent-foreground',
    day_hidden: 'invisible',

  }

  return (
    <td
      className={cn(
        className,
        classNames.cell,
        isOutsideCurrentMonth && classNames.day_outside,
       
      )}
      {...props}
    >
      <Button
        className={cn(classNames.day, !dayHasSchedule && classNames.day_disabled)}>
        {date}

        <div className='flex gap-0.5'>
          {scheduleTimes.map((schedule, index) => (
            <div key={index} className={`text-xs w-1 aspect-square rounded-md text-accent-foreground ${getColor(index) }`} />            
          ))}
          </div>
      </Button>
    </td>
  )
}

export { Calendar }
