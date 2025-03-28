import { data, MetaFunction, Form, Link } from 'react-router'
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
import { redirectWithSuccess } from 'remix-toast'
import { Route } from './+types/profile.($username).schedule.$scheduleId'

const BookingFormSchema = z.object({
  doctorId: z.string({ message: 'Doctor ID is required' }),
  userId: z.string({ message: 'User ID is required' }),
  username: z.string({ message: 'Username is required' }),
  scheduleId: z.string({ message: 'Schedule ID is required' }),
  name: z.string({ message: 'Name is required' }),
  phone: z.string({ message: 'Phone is required' }),
  note: z.string().optional(),
})

export const meta: MetaFunction = () => {
  return [
    { title: 'Book / CH' },
    { name: 'description', content: 'Book appointment from CareHub' },
  ]
}

export async function loader({ request, params }: Route.LoaderArgs) {
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

export async function action({ request }: Route.ActionArgs) {
  console.log('Booking action')
  await requireUser(request)
  const formData = await request.formData()
  const submission = parseWithZod(formData, {
    schema: BookingFormSchema,
  })

  if (submission.status !== 'success') {
    return data(
      submission.reply({ formErrors: ['Could not complete booking'] }),
    )
  }

  // TODO: Send a confirmation email

  const { doctorId, userId, scheduleId, phone, note, username } =
    submission.value

  await prisma.booking.create({
    data: {
      doctorId: doctorId,
      userId: userId,
      scheduleId: scheduleId,
      phone: phone,
      note: note,
    },
  })

  return redirectWithSuccess(`/profile/${username}`, {
    message: 'Doctor Appointment Scheduled Successfully',
  })
}

export default function Booking({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { schedule, user } = loaderData

  const [form, fields] = useForm({
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
        <Form method="POST" {...getFormProps(form)}>
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
            <div className="space-y-4">
              <p className="py-2 text-sm">
                Please, add <strong>your or the patient&apos;s</strong>{' '}
                information below
              </p>

              {/* BOOKING FORM */}
              <input
                {...getInputProps(fields.username, { type: 'hidden' })}
                value={user.username}
              />

              <input
                {...getInputProps(fields.doctorId, { type: 'hidden' })}
                value={schedule.doctorId}
              />

              <input
                {...getInputProps(fields.userId, { type: 'hidden' })}
                value={user.id}
              />

              <input
                {...getInputProps(fields.scheduleId, { type: 'hidden' })}
                value={schedule.id}
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
        </Form>
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
