import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { PageTitle } from '~/components/typography'
import { requireDoctor } from '~/services/auth.server'
import { LocationCombobox } from './resources.location-combobox'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
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

export const meta: MetaFunction = () => {
  return [{ title: 'Schedule / CH' }]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const doctor = await requireDoctor(request)
  return json({ doctor })
}

const DAYS = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
] as const

enum ScheduleType {
  SINGLE_DAY = 'single_day',
  REPEAT_WEEKS = 'repeat_weeks',
}
const DaysEnum = z.enum(DAYS)
type DaysEnum = z.infer<typeof DaysEnum>

const CreateScheduleSchema = z
  .object({
    locationId: z.string({ message: 'Select a location' }),
    days: z
      .array(DaysEnum)
      .min(1, { message: 'Select at least one day' })
      .max(7, { message: 'Select at most 7 days' }),
    startTime: z.string({ message: 'Provide your schedule start time' }),
    endTime: z.string({ message: 'Provide your schedule end time' }),
    maxAppointment: z
      .number()
      .gt(0, { message: 'Maximum appointments must be greater than 0' }),
    repeatWeeks: z.boolean().optional(),
    repeatMonths: z.boolean().optional(),
  })
  .superRefine(({ startTime, endTime }, ctx) => {
    if (startTime >= endTime) {
      ctx.addIssue({
        path: ['endTime'],
        code: 'custom',
        message: 'Start time must be before the End time',
      })
    }
  })

// TODO: Make this work and add validation

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  const submission = await parseWithZod(formData, {
    schema: () =>
      CreateScheduleSchema.transform(async (data, ctx) => {
        const schedule = { id: 1 } // perform schedule create here

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
    return json(submission.reply({ formErrors: ['Could not create schedule'] }))
  }
  return redirect('/add/schedule')
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
      console.log(
        formData.get('locationId'),
        formData.getAll('days'),
        formData.get('startTime'),
        formData.get('endTime'),
        formData.get('maxAppointment'),
        formData.get('repeat'),
      )
      return parseWithZod(formData, { schema: CreateScheduleSchema })
    },
    shouldRevalidate: 'onSubmit',
  })

  return (
    <div className="mx-auto max-w-7xl py-10">
      <PageTitle>Add Schedule_</PageTitle>
      <HelpText />
      <Form method="post" className="mt-10" {...getFormProps(form)}>
        <div className="grid grid-cols-1 gap-12 align-top md:grid-cols-2">
          <input type="hidden" name="userId" value={data.doctor.userId} />
          <LocationCombobox field={fields.locationId} />
          <div className="space-y-1">
            <Label htmlFor="scheduleType">Schedule Type</Label>
            <Select
              defaultValue={scheduleType}
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
                          <Checkbox
                            {...getInputProps(fields.days, {
                              type: 'checkbox',
                              value: day,
                            })}
                          />
                          <span>{day}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 pb-3 pt-1">
                    <ErrorList errors={fields.days.errors} />
                  </div>
                </fieldset>
                <RepeatCheckbox
                  fields={fields}
                  type="weekly"
                  label="Repeat these schedule days for every week"
                />
                <RepeatCheckbox
                  fields={fields}
                  type="monthly"
                  label="Repeat these schedule days for every month"
                />
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center">
          <Button type="submit">Create Schedule</Button>
        </div>
      </Form>
    </div>
  )
}
type CheckboxProps = {
  fields: ReturnType<typeof useForm>[1]
  type: 'weekly' | 'monthly'
  label: string
}

function HelpText() {
  return (
    <div className="mt-6 max-w-5xl space-y-1 text-sm text-secondary-foreground">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className='text-lg'>How create schedule works?</AccordionTrigger>
          <AccordionContent className='space-y-2'>
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

function RepeatCheckbox({ fields, type, label }: CheckboxProps) {
  const field = type === 'weekly' ? fields.repeatWeeks : fields.repeatMonths

  return (
    <div className="items-top flex space-x-2">
      <label
        htmlFor={field.id}
        className="flex items-center space-x-1 text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
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
