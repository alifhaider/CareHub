import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { PageTitle } from '~/components/typography'
import { requireDoctor } from '~/services/auth.server'
import { LocationCombobox } from './resources.location-combobox'
import {
  FieldMetadata,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { z } from 'zod'
import { ErrorList, Field } from '~/components/forms'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useState } from 'react'
import { cn } from '~/lib/utils'
import { CalendarIcon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { format } from 'date-fns'
import { Calendar } from '~/components/ui/calendar'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
import { redirectWithSuccess } from 'remix-toast'
import {
  checkOverlapSchedule,
  getMonthlyScheduleDates,
  getWeeklyScheduleDates,
} from '~/services/schedule.server'
import { prisma } from '~/db.server'

export const meta: MetaFunction = () => {
  return [{ title: 'Schedule / CH' }]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const doctor = await requireDoctor(request)
  return json({ userId: doctor.userId, username: doctor.user.username })
}

export const DAYS = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
] as const

export enum ScheduleType {
  SINGLE_DAY = 'single_day',
  REPEAT_WEEKS = 'repeat_weeks',
}
const DaysEnum = z.enum(DAYS)
type DaysEnum = z.infer<typeof DaysEnum>

export const ScheduleSchema = z
  .object({
    locationId: z.string({ message: 'Select a location' }),
    userId: z.string({ message: 'User ID is required' }),
    username: z.string({ message: 'Username is required' }),
    scheduleType: z.nativeEnum(ScheduleType),
    oneDay: z.date().optional(),
    weeklyDays: z.array(DaysEnum).optional(),
    startTime: z.string({ message: 'Provide your schedule start time' }),
    endTime: z.string({ message: 'Provide your schedule end time' }),
    maxAppointment: z
      .number()
      .gt(0, { message: 'Maximum appointments must be greater than 0' }),
    repeatWeeks: z.boolean().optional(),
    repeatMonths: z.boolean().optional(),
    visitingFee: z.number({ message: 'Add visiting fee' }),
    serialFee: z.number({ message: 'Add schedule fee' }),
    discount: z.number().optional(),
  })
  .refine(
    data => {
      if (data.endTime && data.startTime > data.endTime) {
        return false
      }
      return true
    },
    {
      message: 'Start time must be before the End time',
      path: ['startTime'],
    },
  )
  .superRefine((data, ctx) => {
    if (data.scheduleType === ScheduleType.SINGLE_DAY) {
      if (!data.oneDay) {
        ctx.addIssue({
          path: ['oneDay'],
          code: 'custom',
          message: 'Select a date for the schedule',
        })
      } else {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const selectedDate = new Date(data.oneDay)
        selectedDate.setHours(0, 0, 0, 0)
        if (selectedDate < today) {
          ctx.addIssue({
            path: ['oneDay'],
            code: 'custom',
            message: 'Select a future date',
          })
        }
      }
    } else if (data.scheduleType === ScheduleType.REPEAT_WEEKS) {
      if (!data.weeklyDays?.length) {
        ctx.addIssue({
          path: ['weeklyDays'],
          code: 'custom',
          message: 'Select at least one day for the schedule',
        })
      }
    }
  })

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  const submission = await parseWithZod(formData, {
    schema: () =>
      ScheduleSchema.transform(async (data, ctx) => {
        const weeklyDays = data.weeklyDays
        const isRepetiveMonth = data.repeatMonths
        const isRepetiveWeek = data.repeatWeeks
        const oneDay = data.oneDay
        const startTime = data.startTime
        const endTime = data.endTime
        const locationId = data.locationId

        // console.log({
        //   weeklyDays,
        //   isRepetiveMonth,
        //   isRepetiveWeek,
        //   oneDay,
        //   locationId,
        //   startTime,
        //   endTime,
        // })

        const scheduleDates = oneDay
          ? getMonthlyScheduleDates(oneDay, isRepetiveMonth)
          : getWeeklyScheduleDates(weeklyDays, isRepetiveWeek)

        const schedules = await prisma.schedule.findMany({
          where: {
            doctorId: data.userId,
            date: {
              in: scheduleDates.map(date => new Date(date)),
            },
          },
        })

        const isScheduleOverlapped = checkOverlapSchedule(
          scheduleDates,
          schedules,
          { startTime, endTime },
        )

        // Check if any of the results are `true`
        const hasOverlap = isScheduleOverlapped.some(Boolean)

        if (hasOverlap) {
          ctx.addIssue({
            path: ['form'],
            code: 'custom',
            message: 'Schedule is overlapped with another schedule',
          })
          return z.NEVER
        }

        const schedule = await prisma.schedule.createMany({
          data: scheduleDates.map(date => ({
            doctorId: data.userId,
            locationId,
            date: new Date(date),
            startTime,
            endTime,
            maxAppointments: data.maxAppointment,
            visitFee: data.visitingFee,
            serialFee: data.serialFee,
            discountFee: data.discount,
          })),
        })

        if (!schedule) {
          ctx.addIssue({
            path: ['form'],
            code: 'custom',
            message: 'Could not create schedule',
          })
          return z.NEVER
        }

        return { ...data, schedule }
      }),
    async: true,
  })

  if (submission.status !== 'success') {
    const formErrors = submission.error?.form
    return json(
      submission.reply({
        formErrors: formErrors ?? ['Could not create schedule'],
      }),
    )
  }
  const { username } = submission.value
  return redirectWithSuccess(`/profile/${username}`, {
    message: 'Schedule created successfully',
  })
}

export default function AddSchedule() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    ScheduleType.REPEAT_WEEKS,
  )
  const [date, setDate] = useState<Date>()

  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      // console.log(formData.get('scheduleType'))
      // console.log(formData.getAll('weeklyDays'))
      return parseWithZod(formData, { schema: ScheduleSchema })
    },
    shouldRevalidate: 'onSubmit',
  })

  return (
    <div className="mx-auto max-w-7xl py-10">
      <PageTitle>Add Schedule_</PageTitle>
      <HelpText />
      <Form method="post" className="mt-10" {...getFormProps(form)}>
        <div className="grid grid-cols-1 gap-12 align-top md:grid-cols-2">
          <input
            {...getInputProps(fields.userId, { type: 'hidden' })}
            value={data.userId}
          />
          {/* this is to make the navigation after successful creation */}
          <input
            {...getInputProps(fields.username, { type: 'hidden' })}
            value={data.username}
          />
          <LocationCombobox field={fields.locationId} />
          <div className="space-y-1">
            <Label htmlFor="scheduleType">Schedule Type</Label>
            <Select
              defaultValue={scheduleType}
              {...getInputProps(fields.scheduleType, { type: 'hidden' })}
              onValueChange={value => setScheduleType(value as ScheduleType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ScheduleType.SINGLE_DAY}>One Day</SelectItem>
                <SelectItem value={ScheduleType.REPEAT_WEEKS}>
                  Repeat Weekly
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center gap-8">
              <Field
                labelProps={{ children: 'Start time', className: 'mb-1' }}
                inputProps={{
                  defaultValue: '10:00',
                  ...getInputProps(fields.startTime, { type: 'time' }),
                }}
                errors={fields.startTime.errors}
              />
              <Field
                labelProps={{ children: 'End time', className: 'mb-1' }}
                inputProps={{
                  defaultValue: '17:00',
                  ...getInputProps(fields.endTime, { type: 'time' }),
                }}
                errors={fields.endTime.errors}
              />
            </div>
            <Field
              labelProps={{ children: 'Maximum Appointments per day' }}
              inputProps={{
                defaultValue: 10,
                ...getInputProps(fields.maxAppointment, { type: 'number' }),
              }}
              errors={fields.maxAppointment.errors}
            />
          </div>
          <div className="flex flex-col gap-2">
            {scheduleType === ScheduleType.SINGLE_DAY ? (
              <>
                <Label htmlFor="date" className="mb-1">
                  Date
                </Label>
                <input
                  {...getInputProps(fields.oneDay, { type: 'hidden' })}
                  value={date ? format(date, 'yyyy-MM-dd') : ''}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'mb-2 w-[240px] justify-start text-left font-normal',
                        !date && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <ErrorList errors={fields.oneDay.errors} />

                <RepeatCheckbox
                  field={fields.repeatMonths}
                  label="Repeat every month"
                />
              </>
            ) : null}
            {scheduleType === ScheduleType.REPEAT_WEEKS ? (
              <>
                <Label className="text-sm font-bold">Days</Label>

                <fieldset>
                  <ul className="grid grid-cols-3 gap-x-4 gap-y-2">
                    {DAYS.map(day => (
                      <li key={day} className="flex space-x-2">
                        <label className="flex items-center space-x-2 text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {/* @ts-expect-error @ts-ignore */}
                          <Checkbox
                            {...getInputProps(fields.weeklyDays, {
                              type: 'checkbox',
                              value: day,
                            })}
                          />

                          {/* <input {...getInputProps(fields.weeklyDays, {type: "checkbox", value:day, s})} /> */}
                          <span>{day}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-1">
                    <ErrorList errors={fields.weeklyDays.errors} />
                  </div>
                </fieldset>
                <RepeatCheckbox
                  field={fields.repeatWeeks}
                  label="Repeat every week"
                />
              </>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Field
              labelProps={{ children: 'Visiting Fee' }}
              inputProps={{
                placeholder: '2000tk',
                ...getInputProps(fields.visitingFee, { type: 'number' }),
              }}
              errors={fields.visitingFee.errors}
            />

            <Field
              labelProps={{ children: 'Serial Fee' }}
              inputProps={{
                placeholder: '1000tk',
                ...getInputProps(fields.serialFee, { type: 'number' }),
              }}
              errors={fields.serialFee.errors}
            />

            <Field
              labelProps={{ children: 'Discount' }}
              inputProps={{
                defaultValue: 0,
                ...getInputProps(fields.discount, { type: 'number' }),
              }}
              errors={fields.discount.errors}
            />
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center">
          <Button type="submit">Create Schedule</Button>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <ErrorList errors={form.errors} />
        </div>
      </Form>
    </div>
  )
}
type CheckboxProps = {
  field: FieldMetadata
  label: string
}

function HelpText() {
  return (
    <div className="mt-6 max-w-5xl space-y-1 text-sm text-secondary-foreground">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-lg">
            How create schedule works?
          </AccordionTrigger>
          <AccordionContent className="space-y-2">
            <p>
              A schedule is a set of days and times when you are available for
              appointments. You can create multiple schedules for different
              locations.
            </p>
            <p>
              For example, you can{' '}
              <strong className="text-base">
                create a schedule for your office location and another schedule
                for your home location.
              </strong>
            </p>
            <p>
              Each schedule can have{' '}
              <strong className="text-base">
                {' '}
                different days, times, and maximum appointments per day.
              </strong>
            </p>
            <p>
              When you create a schedule, patients can book appointments with
              you during the times you have set. In between{' '}
              <strong className="text-base">Start Time</strong> and{' '}
              <strong className="text-base">End Time</strong> are the times when
              you are available for appointments.
            </p>
            <p>
              Once you create a schedule, you can view and edit it on your{' '}
              <strong className="text-base">profile page.</strong>
            </p>
            <p>
              While creating a schedule you need to provide the following
              information:
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

function RepeatCheckbox({ field, label }: CheckboxProps) {
  return (
    <div className="items-top flex space-x-2">
      <label
        htmlFor={field.id}
        className="flex items-center space-x-1 text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {/* @ts-expect-error @ts-ignore */}

        <Checkbox
          className="rounded-full"
          {...getInputProps(field, { type: 'checkbox' })}
        />
        <span className="text-sm">{label}</span>
      </label>
    </div>
  )
}

export function ErrorBoundary() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center p-20">
      <PageTitle>404</PageTitle>
      <p className="text-center text-4xl font-bold">Content not found</p>
      <Link to="/" className="text-center text-lg underline">
        Go back
      </Link>
    </div>
  )
}
