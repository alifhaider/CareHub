import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { format } from 'date-fns'
import invariant from 'tiny-invariant'
import { PageTitle } from '~/components/typography'
import { prisma } from '~/db.server'
import { requireUser } from '~/services/auth.server'

import { CalendarIcon, ClockIcon, DollarSignIcon, UserIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Field, TextareaField } from '~/components/forms'
import { z } from 'zod'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { formatTime } from '~/utils/schedule'
import { Spacer } from '~/components/spacer'

const BookingFormSchema = z.object({
  doctorId: z.string(),
  userId: z.string(),
  scheduleId: z.string(),
  name: z.string(),
  phone: z.string(),
  note: z.string().optional(),
})

export const meta: MetaFunction = () => {
  return [
    { title: 'Book / CH' },
    { name: 'description', content: 'Book appointment from CareHub' },
  ]
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUser(request)
  const formData = await request.formData()
  const submission = parseWithZod(formData, {
    schema: BookingFormSchema,
  })

  if (submission.status !== 'success') {
    return json(
      submission.reply({ formErrors: ['Could not complete booking'] }),
    )
  }

  // Save the booking
  // Send a confirmation email

  const booking = await prisma.booking.create({
    data: {
      doctorId: submission.value.doctorId,
      userId: submission.value.userId,
      scheduleId: submission.value.scheduleId,
      phone: submission.value.phone,
      note: submission.value.note,
    },
  })
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  const scheduleId = params.scheduleId
  invariant(scheduleId, 'Schedule ID is required')
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      doctor: {
        include: {
          user: { select: { id: true, username: true, fullName: true } },
        },
      },
    },
  })

  return { schedule, user }
}

export default function Booking() {
  const { schedule, user } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    id: 'booking-form',
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: BookingFormSchema })
    },
    shouldRevalidate: 'onBlur',
  })

  if (!schedule) return <NoScheduleFound />
  const scheduleStartTime = formatTime(schedule.startTime)
  const scheduleEndTime = formatTime(schedule.endTime)

  const doctorName =
    schedule.doctor.user.fullName ?? schedule.doctor.user.username

  // Monday, June 12, 2023
  const formattedDate = format(new Date(schedule.date), 'EEEE, MMMM d, yyyy')

  const totalCost =
    (schedule.visitFee ?? 0) +
    (schedule.serialFee ?? 0) -
    (schedule.discountFee ?? 0)
  const remainingAmount = Math.abs(totalCost - (schedule.depositAmount ?? 0))

  return (
    <div className="container">
      <Spacer variant="lg" />
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Book Your Appointment
          </CardTitle>
          <CardDescription>
            Complete the form below to book your appointment with{' '}
            <Link
              rel="noreferrer"
              target="_blank"
              className="text-cyan-500 underline"
              to={`/profile/${schedule.doctor.user.username}`}
            >
              {doctorName}
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 rounded-lg bg-primary/5 p-4">
            <div className="mb-2 flex items-center">
              <UserIcon className="mr-2 h-5 w-5 text-primary" />
              <span className="font-semibold">{doctorName}</span>
            </div>
            <div className="mb-2 flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="mr-2 h-5 w-5 text-primary" />
              <span>
                {scheduleStartTime} - {scheduleEndTime}
              </span>
            </div>
          </div>

          {/* Cost Breakdown Section */}
          <div className="mb-6 rounded-lg bg-secondary/10">
            <h3 className="mb-3 flex items-center text-lg font-semibold">
              <DollarSignIcon className="mr-2 h-5 w-5 text-primary" />
              Cost Breakdown
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Visit Fee:</span>
                <span>{schedule.visitFee?.toFixed(2)} tk</span>
              </div>
              <div className="flex justify-between">
                <span>Serial Fee:</span>
                <span>{schedule.serialFee?.toFixed(2)} tk</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{schedule.discountFee?.toFixed(2)} tk</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total:</span>
                <span>{totalCost.toFixed(2)} tk</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-primary">
                <span>Deposit:</span>
                <span className="flex items-center gap-1">
                  {' '}
                  {schedule.depositAmount?.toFixed(2)} tk
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-primary">
                <span>Remaining:</span>
                <span className="flex items-center gap-1">
                  {' '}
                  {remainingAmount.toFixed(2)} tk
                </span>
              </div>
            </div>
          </div>

          <hr />
          <Form method="POST" {...getFormProps(form)}>
            <div className="space-y-4">
              <p className="py-2 text-sm">
                Please add{' '}
                <strong className="underline">your or the patient's</strong>{' '}
                information below
              </p>

              <input
                {...getInputProps(fields.doctorId, { type: 'hidden' })}
                value={schedule.doctorId}
              />

              <input
                {...getInputProps(fields.userId, { type: 'hidden' })}
                value={user.id}
              />

              <div className="grid grid-cols-2 gap-4">
                <Field
                  labelProps={{ children: 'Name' }}
                  inputProps={{
                    ...getInputProps(fields.name, { type: 'text' }),
                    defaultValue: user.fullName ?? '',
                  }}
                  errors={fields.name.errors}
                />

                <Field
                  labelProps={{ children: 'Phone' }}
                  inputProps={{
                    ...getInputProps(fields.phone, { type: 'tel' }),
                    defaultValue: user.phone ?? '',
                  }}
                  errors={fields.phone.errors}
                />
              </div>
              <div className="space-y-2"></div>
              <div className="space-y-2">
                <TextareaField
                  labelProps={{ children: 'Additional Notes' }}
                  textareaProps={{
                    ...getInputProps(fields.note, { type: 'text' }),
                  }}
                  errors={fields.note.errors}
                />
              </div>
            </div>
          </Form>
          <p className="text-xs">
            <strong>Note: </strong>You will be charged{' '}
            {schedule.depositAmount?.toFixed(2)} tk deposit now. The remaining
            amount will be charged at the clinic.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit">
            Confirm Booking (Pay {schedule.depositAmount?.toFixed(2)} tk
            Deposit)
          </Button>
        </CardFooter>
      </Card>

      <Spacer variant="lg" />
    </div>
  )
}

const NoScheduleFound = () => {
  return (
    <div className="container flex justify-center">
      <PageTitle>Could not find schedule</PageTitle>
    </div>
  )
}
