import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { useActionData, useLoaderData } from '@remix-run/react'
import { format } from 'date-fns'
import invariant from 'tiny-invariant'
import { Spacer } from '~/components/spacer'
import { PageTitle } from '~/components/typography'
import { prisma } from '~/db.server'
import { requireUser } from '~/services/auth.server'
import { formatTime } from '~/utils/misc'
import { useState } from 'react'

import { CalendarIcon, ClockIcon, UserIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Field, TextareaField } from '~/components/forms'
import { z } from 'zod'
import { getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'

const BookingFormSchema = z.object({
  name: z.string(),
  phone: z.string(),
  notes: z.string().optional(),
})

export const meta: MetaFunction = () => {
  return [
    { title: 'Book / CH' },
    { name: 'description', content: 'Book appointment from CareHub' },
  ]
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUser(request)

}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request)
  const url = new URL(request.url)
  const scheduleId = url.searchParams.get('scheduleId')
  invariant(scheduleId, 'Schedule ID is required')
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { 
      doctor: { include: { user: { select: { id: true, username: true } } } },
     },
  })
  return { schedule, userId }
}

export default function Booking() {
  const { schedule, userId } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [form, fields] = useForm({
  id: 'booking-form',
  lastResult: actionData,
  onValidate({ formData }) {
    return parseWithZod(formData, { schema: BookingFormSchema })
  },
  shouldRevalidate: 'onBlur',
})
  
  if (!schedule) return <NoScheduleFound />
  const scheduleDate = format(new Date(schedule.date), 'dd MMMM, yyyy')
  const scheduleStartTime = formatTime(schedule.startTime)
  const scheduleEndTime = formatTime(schedule.endTime)


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prevState => ({ ...prevState, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Here you would typically send the data to your backend
  }

  const doctorName = schedule.doctor.fullName ?? schedule.doctor.user.username


  // Monday, June 12, 2023
  const formattedDate = format(new Date(schedule.date), 'EEEE, MMMM d, yyyy')

  return (
    <div className='page-container'>
      <PageTitle>Book Appointment</PageTitle>
      <Spacer variant='lg' />
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardDescription className="font-bold text-sm">Complete the form below to book your appointment with { doctorName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center mb-2">
            <UserIcon className="mr-2 h-5 w-5 text-primary" />
              <span className="font-semibold">{ doctorName}</span>
          </div>
          <div className="flex items-center mb-2">
            <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
              <span>{ formattedDate}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="mr-2 h-5 w-5 text-primary" />
              <span>{scheduleStartTime} - {scheduleEndTime } </span>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                 <Field
                labelProps={{ children: 'Name' }}
                inputProps={{
                  ...getInputProps(fields.name, { type: 'text' }),
                }}
                errors={fields.name.errors}
              />
         
              <Field
                labelProps={{ children: 'Phone' }}
                inputProps={{
                  ...getInputProps(fields.phone, { type: 'tel' }),
                }}
                errors={fields.phone.errors}
              />
            </div>
            <div className="space-y-2">
            </div>
            <div className="space-y-2">
              <TextareaField
                labelProps={{ children: 'Additional Notes' }}
                textareaProps={{
                  ...getInputProps(fields.notes, { type: 'text' }),
                }}
                errors={fields.notes.errors}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSubmit}>Confirm Booking</Button>
      </CardFooter>
      </Card>
    </div>
  )
}

const NoScheduleFound = () => {
  return (
    <div className='page-container flex justify-center'>
      <PageTitle>Could not find schedule</PageTitle>
    </div>
  )
}