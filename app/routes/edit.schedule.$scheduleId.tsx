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
import { ScheduleSchema, ScheduleType } from './add.schedule'
import { z } from 'zod'
import { jsonWithError, jsonWithSuccess } from 'remix-toast'
import { Button } from '~/components/ui/button'
import { useState } from 'react'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { LocationCombobox } from './resources.location-combobox'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Field } from '~/components/forms'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '~/components/ui/calendar'

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
  })
  if (!schedule) {
    return redirect('/')
  }
  return json({ schedule })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  const submission = await parseWithZod(formData, {
    schema: () =>
      ScheduleSchema.transform(async (data, ctx) => {
        const schedule = { id: 1 } // perform schedule update here

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
  console.log('running action')
  return jsonWithSuccess(
    { result: 'Schedule updated successfully' },
    { message: 'Schedule updated successfully!' },
  )
}

export default function EditSchedule() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [scheduleType, setScheduleType] = useState<ScheduleType>()
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
      return parseWithZod(formData, { schema: ScheduleSchema })
    },
    shouldRevalidate: 'onSubmit',
  })

  return (
    <div className="mx-auto max-w-7xl py-10">
      <PageTitle>Edit Schedule</PageTitle>
      <Form method="post" className="mt-10" {...getFormProps(form)}>
        <div className="grid grid-cols-1 gap-12 align-top md:grid-cols-2">
          <input type="hidden" name="userId" value={data.schedule.doctorId} />
          <LocationCombobox
            field={fields.locationId}
            selectedLocationId={data.schedule.locationId}
          />
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
                {/* <RepeatCheckbox
                  fields={fields}
                  type="monthly"
                  label="Repeat this schedule date for every month"
                /> */}
              </>
            ) : null}
            {/* {scheduleType === ScheduleType.REPEAT_WEEKS ? (
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
            ) : null} */}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center">
          <Button type="submit">Create Schedule</Button>
        </div>
      </Form>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
