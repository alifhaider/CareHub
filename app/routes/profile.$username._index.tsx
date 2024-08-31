import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { MapPin } from 'lucide-react'
import React from 'react'
import { DayProps } from 'react-day-picker'
import { Spacer } from '~/components/spacer'
import { PageTitle, SectionTitle } from '~/components/typography'
import { Button } from '~/components/ui/button'
import { Calendar, CustomCell } from '~/components/ui/calendar'
import { prisma } from '~/db.server'
import { requireDoctor } from '~/services/auth.server'
import { authSessionStorage } from '~/services/session.server'
import { invariantResponse } from '~/utils/misc'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.user.username} / CH` },
    { name: 'description', content: `CareHub ${data?.user.username} Profile!` },
  ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const username = params.username
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )

  // TODO: Delete old schedules
  // await prisma.schedule.deleteMany({
  //   where: {
  //     startTime: {
  //       lt: today, // Less than today
  //     },
  //   },
  // });

  const loggedInUserId = cookieSession.get('userId')
  const user = await prisma.user.findFirst({
    where: { username },
    include: {
      doctor: {
        include: {
          specialties: { select: { id: true, name: true } },
          education: {
            select: {
              id: true,
              degree: true,
              institute: true,
              year: true,
            },
          },
          schedules: {
            // where: { startTime: { gte: today } },
            include: {
              fees: {
                select: { id: true, serial: true, visit: true, discount: true },
              },
              location: {
                select: {
                  id: true,
                  address: true,
                  name: true,
                  city: true,
                  state: true,
                  zip: true,
                },
              },
            },
          },
        },
      },
      bookings: {
        include: {
          doctor: {
            select: { fullName: true, user: { select: { username: true } } },
          },
        },
      },
    },
  })

  invariantResponse(user, 'User not found', { status: 404 })
  const isOwner = user?.id === loggedInUserId
  const isDoctor = user?.doctor || false

  return json({ user, isOwner, isDoctor })
}

export async function action({ request }: LoaderFunctionArgs) {
  await requireDoctor(request)
  const formData = await request.formData()
  const scheduleId = formData.get('scheduleId')

  if (scheduleId) {
    await prisma.schedule.delete({ where: { id: String(scheduleId) } })
  }

  return json({ status: 'success' })
}

export default function User() {
  const { isDoctor, isOwner, user } = useLoaderData<typeof loader>()
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const schedules = user.doctor?.schedules
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of the day

  const scheduleTimes = schedules?.map(schedule => ({
    id: schedule.id,
    startTime: new Date(schedule.startTime),
    endTime: new Date(schedule.endTime),
    date: new Date(schedule.day),
  }))

  function handleDateClick(date: Date | undefined) {
    if (!date) return
    setSelectedDate(date)
  }

  // find the nearest upcoming schedule day
  const upcomingDays = schedules
    ?.map(schedule => new Date(schedule.day).setHours(0, 0, 0, 0)) // Normalize to start of the day
    .filter(day => day >= today.getTime()) // Filter out past days
    .sort((a, b) => a - b) // Sort in ascending order

  const nearestDay = upcomingDays?.[0]

  // Filter out schedules for the nearest day
  const upcomingSchedules = nearestDay
    ? schedules?.filter(schedule => {
        const scheduleDay = new Date(schedule.day).setHours(0, 0, 0, 0)
        return scheduleDay === nearestDay
      })
    : []

  const selectedSchedule = user.doctor?.schedules?.filter(schedule => {
    if (!selectedDate) return
    const scheduleDate = new Date(schedule.day)
    return (
      scheduleDate.getDate() === selectedDate.getDate() &&
      scheduleDate.getMonth() === selectedDate.getMonth() &&
      scheduleDate.getFullYear() === selectedDate.getFullYear()
    )
  })

  const displayedSchedules = selectedDate ? selectedSchedule : upcomingSchedules

  return (
    <div className="page-container">
      <div className="flex gap-6">
        <div className="h-32 w-32 rounded-sm bg-primary-foreground shadow-sm" />
        <div>
          <SectionTitle>{user.doctor?.fullName ?? user.username}</SectionTitle>
          <ul className="mt-2 flex items-center gap-4">
            {isDoctor ? (
              <>
                {user.doctor?.specialties.map(specialty => (
                  <li key={specialty.id} className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-amber-300"></div>
                    {specialty.name}
                  </li>
                ))}
              </>
            ) : null}
          </ul>
          <ul className="text-accent-foreground">
            {isDoctor ? (
              <>
                {user.doctor?.education.map(education => (
                  <li key={education.id}>
                    {education.degree} | {education.institute}
                    <span className="ml-1 text-sm">({education.year})</span>
                  </li>
                ))}
              </>
            ) : null}
          </ul>
        </div>
      </div>

      {isDoctor && isOwner ? (
        <Button asChild variant="outline" className="mt-6">
          <Link to="/add/schedule">Create a new Schedule</Link>
        </Button>
      ) : null}

      <Spacer variant="lg" />
      {isOwner ? (
        <>
          <h2 className="text-3xl font-medium text-lime-500">
            Booked Appointments
          </h2>
          <ul>
            {user.bookings.map(appointment => (
              <li key={appointment.id}>
                {appointment.date} |{' '}
                <Link
                  to={`/profile/${appointment.doctor.user.username}`}
                  className="text-blue-400 underline"
                >
                  {appointment.doctor.fullName ??
                    appointment.doctor.user.username}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {isDoctor ? (
        <>
          <Spacer variant="md" />
          <div className="flex gap-10">
            <div>
              <h4 className="mb-4 text-3xl font-medium text-lime-500">
                Availabilty Calendar
              </h4>
              <Calendar
                onSelect={handleDateClick}
                components={{
                  Day: (props: DayProps) => (
                    <CustomCell scheduleTimes={scheduleTimes} {...props} />
                  ),
                }}
                mode="single"
              />
            </div>

            {displayedSchedules && displayedSchedules.length > 0 && isDoctor ? (
              <Schedules
                schedules={displayedSchedules}
                isOwner={isOwner}
                isDoctor={isDoctor && true}
                username={user.username}
              />
            ) : null}
          </div>
        </>
      ) : null}

      <Spacer variant="md" />
      {isDoctor ? <Reviews /> : null}
    </div>
  )
}

export function ErrorBoundary() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center p-20">
      <PageTitle>404</PageTitle>
      <p className="text-center text-4xl font-bold">User not found</p>
      <Link to="/search" className="text-center text-lg underline">
        Go back
      </Link>
    </div>
  )
}

type ScheduleProp = {
  id: string
  day: string
  startTime: string
  endTime: string
  location: {
    id: string
    name: string
    address: string
    city: string
    state: string | null
    zip: string | null
  }
  fees: {
    id: string
    serial: number | null
    visit: number | null
    discount: number | null
  }[]
}

type ScheduleProps = {
  schedules: ScheduleProp[] | undefined
  isOwner: boolean
  isDoctor: boolean
  username: string
}

const Schedules = ({
  schedules,
  isDoctor,
  isOwner,
  username,
}: ScheduleProps) => {
  function getFormattedDate(date: string) {
    const dateObj = new Date(date)
    const month = dateObj.toLocaleString('default', { month: 'long' })
    const day = dateObj.getDate()
    const year = dateObj.getFullYear()
    return `${day} ${month}, ${year}`
  }

  function getHours(time: string) {
    const date = new Date(time)
    const hours = date.getHours()
    const minutes = date.getMinutes()

    const hoursString =
      hours < 10 ? `0${hours}` : hours > 10 ? `${hours % 12}` : hours
    const minutesString = minutes < 10 ? `0${minutes}` : minutes
    return `${hoursString}:${minutesString}${hours > 12 ? 'PM' : 'AM'}`
  }
  return (
    <div className="flex-1">
      <h4 className="mb-4 text-3xl font-medium text-lime-500">Schedules</h4>
      <ul className="space-y-4">
        {schedules?.map(schedule => (
          <li
            key={schedule.location.id}
            className="flex items-center rounded-md border transition-all hover:shadow-md"
          >
            <div className="h-full w-full px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <MapPin className="h-8 w-8" />
                  <div>
                    <h6 className="flex items-end text-2xl font-bold leading-none">
                      {schedule.location.name}{' '}
                      <span className="text-xs font-normal">
                        /{getFormattedDate(schedule.day)} (
                        {getHours(schedule.startTime)}-
                        {getHours(schedule.endTime)})
                      </span>
                    </h6>
                    <p></p>
                    <div className="mt-2 text-sm text-accent-foreground">
                      {schedule.location.address}, {schedule.location.city},{' '}
                      {schedule.location.state}, {schedule.location.zip}
                    </div>
                    <div className="mt-4">
                      {!isOwner && (
                        <Link
                          to={`/profile/${username}/book`}
                          className="flex w-max items-start rounded-md bg-amber-300 px-2 py-1 text-secondary"
                        >
                          Book Now
                        </Link>
                      )}
                      {isOwner && isDoctor && (
                        <Form method="POST">
                          <input
                            type="hidden"
                            name="scheduleId"
                            value={schedule.id}
                          />
                          <button className="flex w-max items-start rounded-md bg-rose-700 px-2 py-1 text-secondary dark:text-secondary-foreground">
                            Remove Schedule
                          </button>
                        </Form>
                      )}
                    </div>
                  </div>
                </div>
                <ul>
                  {schedule.fees.map(fee => (
                    <li key={fee.id}>
                      <div className="text-xl font-bold text-accent-foreground">
                        Visiting Fee: {fee.visit}tk
                      </div>
                      <div className="text-secondary-foreground">
                        Serial Fee: {fee.serial}tk
                      </div>
                      <div className="text-sm text-secondary-foreground">
                        Discount: {fee.discount}tk
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const Reviews = () => {
  return (
    <div>
      <h4 className="mb-4 text-3xl font-medium text-lime-500">Reviews</h4>
      <ul>
        <li className="rounded-md bg-secondary px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-foreground" />
            <div>
              <h6 className="text-xl font-bold">John Doe</h6>
              <p className="text-accent-foreground">5/5</p>
              <p className="text-accent-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam
                viverra euismod odio, gravida pellentesque urna varius vitae.
              </p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  )
}
