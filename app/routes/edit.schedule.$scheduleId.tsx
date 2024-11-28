import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node'
import {
  Form,
  MetaFunction,
  useActionData,
  useLoaderData,
} from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { PageTitle } from '~/components/typography'
import { prisma } from '~/db.server'
import { requireDoctor } from '~/services/auth.server'
import { z } from 'zod'
import { redirectWithError, redirectWithSuccess } from 'remix-toast'
import { Button } from '~/components/ui/button'
import { useState } from 'react'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { LocationCombobox } from './resources.location-combobox'
import { Label } from '~/components/ui/label'
import { ErrorList, Field } from '~/components/forms'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '~/components/ui/calendar'
import { cn } from '~/utils/misc'
import { Spacer } from '~/components/spacer'
import { checkOverlapSchedule } from '~/services/schedule.server'
import { formatTimeToTwoDigits } from '~/utils/schedule'

export const UpdateScheduleSchema = z
  .object({
    scheduleId: z.string({ message: 'Schedule ID is required' }),
    locationId: z.string({ message: 'Select a location' }),
    userId: z.string({ message: 'User ID is required' }),
    username: z.string({ message: 'Username is required' }),
    date: z.string({ message: 'Select a date for the schedule' }),
    startTime: z.string({ message: 'Provide your schedule start time' }),
    endTime: z.string({ message: 'Provide your schedule end time' }),
    maxAppointment: z.coerce
      .number()
      .gt(0, { message: 'Maximum appointments must be greater than 0' }),
    repeatMonths: z.boolean().optional(),
    visitingFee: z.coerce.number({ message: 'Add visiting fee' }),
    serialFee: z.coerce.number({ message: 'Add schedule fee' }),
    discount: z.coerce.number().optional(),
  })
  .refine(
    data => {
      const [startHours, startMinutes] = data.startTime.split(':').map(Number)
      const [endHours, endMinutes] = data.endTime.split(':').map(Number)
      const startTime = startHours * 60 + startMinutes
      const endTime = endHours * 60 + endMinutes
      return startTime < endTime
    },
    {
      message: 'Start time must be before the End time',
      path: ['startTime'],
    },
  )

export const meta: MetaFunction = () => {
  return [{ title: 'Edit Schedule / CH' }]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const doctor = await requireDoctor(request)
  const scheduleId = params.scheduleId
  const schedule = await prisma.schedule.findUnique({
    where: {
      id: scheduleId,
      doctorId: doctor.userId,
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
    },
  })
  if (!schedule) {
    return redirect('/')
  }
  return json({
    schedule,
    userId: doctor.userId,
    username: doctor.user.username,
  })
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData()
  const scheduleId = params.scheduleId

  if (!scheduleId) {
    return redirectWithError('/', {
      message: 'Schedule not found',
    })
  }

  const submission = await parseWithZod(formData, {
    schema: () =>
      UpdateScheduleSchema.transform(async (data, ctx) => {
        const startTime = data.startTime
        const endTime = data.endTime
        const date = new Date(data.date)

        // filter out the schedule that are not the current schedule
        const schedules = await prisma.schedule.findMany({
          where: {
            doctorId: data.userId,
            id: {
              not: scheduleId,
            },
          },
          select: {
            date: true,
            startTime: true,
            endTime: true,
          },
        })

        const isScheduleOverlapped = checkOverlapSchedule([date], schedules, {
          startTime,
          endTime,
        })

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

        const schedule = await prisma.schedule.update({
          where: { id: scheduleId },
          data: {
            locationId: data.locationId,
            startTime: data.startTime,
            endTime: data.endTime,
            date: new Date(data.date),
            maxAppointments: data.maxAppointment,
            visitFee: data.visitingFee,
            serialFee: data.serialFee,
            discountFee: data.discount,
          },
        })

        if (!schedule) {
          ctx.addIssue({
            code: 'custom',
            message: 'Could not update schedule',
          })
          return z.NEVER
        }

        return { ...data, schedule }
      }),
    async: true,
  })

  if (submission.status !== 'success') {
    return json(submission.reply({ formErrors: ['Could not update schedule'] }))
  }
  const { username } = submission.value
  return redirectWithSuccess(`/profile/${username}`, {
    message: 'Schedule updated successfully',
  })
}

export default function EditSchedule() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [date, setDate] = useState<Date>(new Date(data.schedule.date))

  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: UpdateScheduleSchema })
    },
    shouldRevalidate: 'onSubmit',
  })

  return (
    <div className="container">
      <Spacer variant="lg" />
      <PageTitle>Edit Schedule</PageTitle>
      <Spacer variant="lg" />
      <Form method="PUT" className="space-y-8" {...getFormProps(form)}>
        <div className="grid grid-cols-1 gap-12 align-top md:grid-cols-2">
          <input
            {...getInputProps(fields.userId, { type: 'hidden' })}
            value={data.userId}
          />
          <input
            {...getInputProps(fields.username, { type: 'hidden' })}
            value={data.username}
          />

          <input
            {...getInputProps(fields.scheduleId, { type: 'hidden' })}
            value={data.schedule.id}
          />

          <div className="space-y-8">
            <LocationCombobox
              field={fields.locationId}
              selectedLocation={data.schedule.location}
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="date" className="mb-1">
                Date
              </Label>

              <input
                {...getInputProps(fields.date, { type: 'hidden' })}
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
                    disabled={date => date < new Date()}
                    onSelect={selectedDate =>
                      selectedDate && setDate(selectedDate)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <ErrorList errors={fields.date.errors} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-8">
              <Field
                labelProps={{ children: 'Start time', className: 'mb-1' }}
                inputProps={{
                  defaultValue: formatTimeToTwoDigits(data.schedule.startTime),
                  ...getInputProps(fields.startTime, { type: 'time' }),
                }}
                errors={fields.startTime.errors}
              />
              <Field
                labelProps={{ children: 'End time', className: 'mb-1' }}
                inputProps={{
                  defaultValue: formatTimeToTwoDigits(data.schedule.endTime),
                  ...getInputProps(fields.endTime, { type: 'time' }),
                }}
                errors={fields.endTime.errors}
              />
            </div>
            <Field
              labelProps={{ children: 'Maximum Appointments per day' }}
              inputProps={{
                defaultValue: data.schedule.maxAppointments,
                ...getInputProps(fields.maxAppointment, { type: 'number' }),
              }}
              errors={fields.maxAppointment.errors}
            />
          </div>
        </div>
        <div className="md:w-1/2">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Field
              labelProps={{ children: 'Visiting Fee' }}
              inputProps={{
                placeholder: '2000',
                defaultValue: data.schedule.visitFee || 0,
                ...getInputProps(fields.visitingFee, { type: 'number' }),
              }}
              errors={fields.visitingFee.errors}
            />

            <Field
              labelProps={{ children: 'Serial Fee' }}
              inputProps={{
                placeholder: '1000',
                defaultValue: data.schedule.serialFee || 0,
                ...getInputProps(fields.serialFee, { type: 'number' }),
              }}
              errors={fields.serialFee.errors}
            />

            <Field
              labelProps={{ children: 'Discount' }}
              inputProps={{
                defaultValue: data.schedule.discountFee || 0,
                ...getInputProps(fields.discount, { type: 'number' }),
              }}
              errors={fields.discount.errors}
            />
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center">
          <Button type="submit">Update Schedule</Button>
        </div>

        <ErrorList errors={form.errors} />
      </Form>

      <Spacer variant="lg" />
    </div>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
