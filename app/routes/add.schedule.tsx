import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { PageTitle } from '~/components/typography'
import { prisma } from '~/db.server'
import { requireDoctor } from '~/services/auth.server'
import { LocationCombobox } from './resources.location-combobox'
import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { z } from 'zod'
import { CheckboxField, ErrorList, Field } from '~/components/forms'
import { StatusButton } from '~/components/ui/status-button'
import { useIsPending } from '~/utils/misc'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { Button } from '~/components/ui/button'

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
const DaysEnum = z.enum(DAYS)
type DaysEnum = z.infer<typeof DaysEnum>

const CreateScheduleSchema = z
  .object({
    days: z
      .array(DaysEnum)
      .min(1, { message: 'Please select at least one day' })
      .max(7, { message: 'Please select at most 7 days' }),
    startTime: z.string({ message: 'Please provide your schedule start time' }),
    endTime: z.string({ message: 'Please provide your schedule end time' }),
    maxAppointment: z
      .number()
      .gt(0, { message: 'Maximum appointments must be greater than 0' }),
    repeat: z.boolean().optional(),
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
  console.log('calling action')
  const formData = await request.formData()
  const submission = await parseWithZod(formData, {
    schema: () =>
      CreateScheduleSchema.transform(async (data, ctx) => {
        const schedule = { id: 1 }

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
    return json(submission.reply())
  }

  const { days, endTime, startTime, maxAppointment, repeat } = submission.value
  console.log('formData', formData.get('locationId'))
  console.log('days', formData.getAll('days'))
  console.log('startTime', formData.get('startTime'))
  console.log('endTime', formData.get('endTime'))
  console.log('maxAppointment', formData.get('maxAppointment'))

  return redirect('/add/schedule')
}

export default function AddSchedule() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      console.log(
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
      <PageTitle>Add Schedule</PageTitle>

      <Form method="post" className="mt-10" {...getFormProps(form)}>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <input type="hidden" name="userId" value={data.doctor.userId} />
          <div>
            <LocationCombobox />
          </div>
          <div>
            <div className="space-y-1">
              <Label className="text-sm font-bold">Days</Label>

              <fieldset>
                <ul className="grid grid-cols-3 gap-x-4 gap-y-2">
                  {DAYS.map(day => (
                    <li key={day} className="flex space-x-2">
                      <label className="space-x-2 flex items-center text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
            </div>
            <div className="items-top flex space-x-2">

            <label
              htmlFor={fields.repeat.id}
              className="space-x-1 flex items-center text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <Checkbox {...getInputProps(fields.repeat, { type: 'checkbox' })} />
              <span> Repeat this schedule for every week</span>
            </label>
            </div>
          </div>
          <div className="flex items-center justify-between gap-8">
            <Field
              labelProps={{ children: 'Start time' }}
              inputProps={{
                defaultValue: '10:00',
                ...getInputProps(fields.startTime, { type: 'time' }),
              }}
              errors={fields.startTime.errors}
            />
            <Field
              labelProps={{ children: 'End time' }}
              inputProps={{
                defaultValue: '17:00',
                ...getInputProps(fields.endTime, { type: 'time' }),
              }}
              errors={fields.endTime.errors}
            />
            <Field
              labelProps={{ children: 'Maximum Appointments per day' }}
              inputProps={{
                defaultValue: 10,
                ...getInputProps(fields.maxAppointment, { type: 'number' }),
              }}
              errors={fields.maxAppointment.errors}
            />
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center">
          <Button type="submit">
            Create Schedule
          </Button>
        </div>
      </Form>
      {/* <div className="w-1/3">
        <Button onClick={() => setOpenLocationForm(t => !t)}>
          Register a new location
        </Button>
        {openLocationForm ? (
          <locationFetcher.Form
            method="POST"
            className="flex max-w-xl flex-col gap-10 border p-10"
          >
            <label>
              Location Name
              <input type="text" name="name" />
            </label>

            <label>
              Address
              <input type="text" name="address" required />
            </label>

            <label>
              City
              <input type="text" name="city" required />
            </label>
            <label>
              State
              <input type="state" name="state" />
            </label>
            <label>
              Zip
              <input type="text" name="zip" />
            </label>

            <Button type="submit" value="create_location" name="_action">
              Add Service Location
            </Button>
          </locationFetcher.Form>
        ) : null}
      </div> */}

      {/* {actionData && <p>{actionData.name} has been added</p>} */}
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
