import { parseWithZod } from '@conform-to/zod'
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
import { LocationCombobox } from './resources.location-combobox'
import { Label } from '~/components/ui/label'
import { Field } from '~/components/forms'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '~/components/ui/calendar'
import { cn } from '~/utils/misc'
import { Checkbox } from '~/components/ui/checkbox'

export const UpdateScheduleSchema = z
  .object({
    locationId: z.string({ message: 'Select a location' }),
    userId: z.string({ message: 'User ID is required' }),
    username: z.string({ message: 'Username is required' }),
    date: z.string({ message: 'Select a date for the schedule' }),
    startTime: z.string({ message: 'Provide your schedule start time' }),
    endTime: z.string({ message: 'Provide your schedule end time' }),
    maxAppointment: z
      .number()
      .gt(0, { message: 'Maximum appointments must be greater than 0' }),
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

export const meta: MetaFunction = () => {
  return [{ title: 'Schedule / CH' }]
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
        const schedule = await prisma.schedule.update({
          where: { id: scheduleId },
          data: {
            locationId: data.locationId,
            startTime: data.startTime,
            endTime: data.endTime,
            date: new Date(data.date),
            maxAppointments: data.maxAppointment,
          },
        })

        if (!schedule) {
          ctx.addIssue({
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
  const [date, setDate] = useState<Date>()

  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: UpdateScheduleSchema })
    },
    shouldRevalidate: 'onSubmit',
  })

  return (
    <div className="mx-auto max-w-7xl py-10">
      <PageTitle>Edit Schedule</PageTitle>
      <Form method="post" className="mt-10" {...getFormProps(form)}>
        <div className="grid grid-cols-1 gap-12 align-top md:grid-cols-2">
          <input
            {...getInputProps(fields.userId, { type: 'hidden' })}
            value={data.userId}
          />
          <input
            {...getInputProps(fields.username, { type: 'hidden' })}
            value={data.username}
          />

          <LocationCombobox
            field={fields.locationId}
            selectedLocation={data.schedule.location}
          />
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
            <Label htmlFor="date" className="mb-1">
              Date
            </Label>
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
            <RepeatCheckbox
              fields={fields}
              type="monthly"
              label="Repeat this schedule date for every month"
            />
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center">
          <Button type="submit">Update Schedule</Button>
        </div>
      </Form>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

type CheckboxProps = {
  fields: ReturnType<typeof useForm>[1]
  type: 'weekly' | 'monthly'
  label: string
}

function RepeatCheckbox({ fields, type, label }: CheckboxProps) {
  const field = type === 'weekly' ? fields.repeatWeeks : fields.repeatMonths

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
  return <GeneralErrorBoundary />
}
