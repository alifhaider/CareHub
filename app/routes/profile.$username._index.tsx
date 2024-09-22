import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { format } from 'date-fns'
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
import { formatTime, invariantResponse } from '~/utils/misc'

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
          schedule: {
            select: {
              date: true,
              startTime: true,
              endTime: true,
            },
          },
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
    date: new Date(schedule.date),
  }))

  function handleDateClick(date: Date | undefined) {
    if (!date) return
    setSelectedDate(date)
  }

  // find the nearest upcoming schedule day
  const upcomingDays = schedules
    ?.map(schedule => new Date(schedule.date).setHours(0, 0, 0, 0)) // Normalize to start of the day
    .filter(day => day >= today.getTime()) // Filter out past days
    .sort((a, b) => a - b) // Sort in ascending order

  const nearestDay = upcomingDays?.[0]

  // Filter out schedules for the nearest day
  const upcomingSchedules = nearestDay
    ? schedules?.filter(schedule => {
        const scheduleDay = new Date(schedule.date).setHours(0, 0, 0, 0)
        return scheduleDay === nearestDay
      })
    : []

  const selectedSchedule = user.doctor?.schedules?.filter(schedule => {
    if (!selectedDate) return
    const scheduleDate = new Date(schedule.date)
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
        <div className="w-full">
          <div className="flex items-center justify-between">
            <SectionTitle>
              {user.doctor?.fullName ?? user.username}
            </SectionTitle>
            {isDoctor && isOwner ? (
              <Button asChild variant="outline">
                <Link to="/profile/edit">Edit Profile</Link>
              </Button>
            ) : null}
          </div>
          {isDoctor ? (
            <>
              <ul className="mt-2 flex items-center gap-4">
                {user.doctor?.specialties.map(specialty => (
                  <li key={specialty.id} className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-amber-300"></div>
                    {specialty.name}
                  </li>
                ))}
              </ul>
              <ul className="text-accent-foreground">
                {user.doctor?.education.map(education => (
                  <li key={education.id}>
                    {education.degree} | {education.institute}
                    <span className="ml-1 text-sm">({education.year})</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>

      <Spacer variant="lg" />
      {isOwner ? (
        <>
          <h2 className="text-3xl font-medium text-lime-500">
            Booked Appointments
          </h2>
          <ul>
            {user.bookings.map(appointment => (
              <li key={appointment.id}>
                <span className="text-accent-foreground">
                  {new Date(appointment.schedule.date).toDateString()}
                </span>
                {' - '}
                <span className="text-accent-foreground">
                  {appointment.schedule.startTime} -{' '}
                  {appointment.schedule.endTime}
                </span>

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
          <div className="flex flex-col gap-10 md:flex-row">
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

            {displayedSchedules && isDoctor ? (
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
  date: string
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
  serialFee: number | null
  discountFee: number | null
  visitFee: number | null
}

type ScheduleProps = {
  schedules: ScheduleProp[] | undefined
  isOwner: boolean
  isDoctor: boolean
  username: string
}

const Schedules = ({ schedules, isDoctor, isOwner }: ScheduleProps) => {
  return (
    <div className="flex-1">
      <h4 className="mb-4 text-3xl font-medium text-lime-500">Schedules</h4>
      <Spacer variant="sm" />
      {schedules && schedules?.length > 0 && (
        <div className="relative flex items-center">
          <span className="h-0.5 w-full border"></span>
          <h5 className="mx-1 text-nowrap text-sm font-medium text-secondary-foreground">
            {format(schedules[0].date ?? new Date(), 'dd MMMM, yyyy')}
          </h5>
          <span className="h-0.5 w-full border"></span>
        </div>
      )}
      <Spacer variant="sm" />

      <ul className="space-y-4">
        {schedules?.map(schedule => (
          <li
            key={schedule.location.id}
            className="flex items-center rounded-md border transition-all"
          >
            <div className="h-full w-full px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <MapPin className="h-8 w-8" />
                  <div>
                    <h6 className="flex items-end text-2xl font-bold leading-none">
                      {schedule.location.name}{' '}
                      <span className="text-xs font-normal">
                        /{formatTime(schedule.startTime)} -{' '}
                        {formatTime(schedule.endTime)}
                      </span>
                    </h6>
                    <div className="mt-2 text-sm text-accent-foreground">
                      {schedule.location.address}, {schedule.location.city},{' '}
                      {schedule.location.state}, {schedule.location.zip}
                    </div>
                    <div className="mt-4">
                      {!isOwner && (
                        <Link
                          to={`/profile/schedule/${schedule.id}`}
                          className="flex w-max items-start rounded-md bg-amber-300 px-2 py-1 text-secondary"
                        >
                          Book Now
                        </Link>
                      )}
                      {isOwner && isDoctor && (
                        <div className="flex gap-2 text-sm">
                          <button className="flex w-max items-start rounded-md border border-secondary-foreground bg-secondary px-2 py-1 text-secondary-foreground">
                            <Link to={`/edit/schedule/${schedule.id}`}>
                              Edit Schedule
                            </Link>
                          </button>
                          <Form method="POST">
                            <input
                              type="hidden"
                              name="scheduleId"
                              value={schedule.id}
                            />
                            <button className="flex w-max items-start rounded-md border border-destructive bg-destructive px-2 py-1 text-destructive-foreground transition-all">
                              Remove Schedule
                            </button>
                          </Form>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-accent-foreground">
                    Visit Fee: {schedule.visitFee}tk
                  </div>
                  <div className="text-secondary-foreground">
                    Serial Fee: {schedule.serialFee}tk
                  </div>
                  <div className="text-sm text-secondary-foreground">
                    Discount: {schedule.discountFee}tk
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {isDoctor && isOwner ? (
        <div className="flex items-center">
          <Button asChild variant="default" className="mt-6">
            <Link to="/add/schedule">Create a new schedule plan</Link>
          </Button>
        </div>
      ) : null}
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
            <div className="rounded-full bg-primary-foreground" />
            <div>
              <div className="mx-auto mt-10 w-full max-w-xl rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center gap-4">
                  <img src="" alt="Doctor" />

                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Dr. Kristi Marquardt
                    </h2>
                    <p className="text-sm text-gray-500">Cardiologist</p>
                    <div className="mt-2 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 .288l2.833 8.718h9.167l-7.417 5.385 2.833 8.719-7.416-5.387-7.417 5.387 2.834-8.719-7.417-5.385h9.166z" />
                      </svg>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 .288l2.833 8.718h9.167l-7.417 5.385 2.833 8.719-7.416-5.387-7.417 5.387 2.834-8.719-7.417-5.385h9.166z" />
                      </svg>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 .288l2.833 8.718h9.167l-7.417 5.385 2.833 8.719-7.416-5.387-7.417 5.387 2.834-8.719-7.417-5.385h9.166z" />
                      </svg>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 .288l2.833 8.718h9.167l-7.417 5.385 2.833 8.719-7.416-5.387-7.417 5.387 2.834-8.719-7.417-5.385h9.166z" />
                      </svg>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        className="h-5 w-5 text-gray-300"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 .288l2.833 8.718h9.167l-7.417 5.385 2.833 8.719-7.416-5.387-7.417 5.387 2.834-8.719-7.417-5.385h9.166z" />
                      </svg>
                      <span className="ml-2 text-gray-600">(4.0)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-gray-700">
                    Dr. Kristi Marquardt is an exceptional Physiatrist. His
                    attention to detail and dedication to patient care are truly
                    commendable. He took the time to explain everything
                    thoroughly and made me feel at ease throughout the
                    consultation.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-gray-600">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="font-semibold">John Doe</p>
                      <p className="text-sm">August 15, 2024</p>
                    </div>
                  </div>
                  <button className="text-blue-500 hover:underline">
                    See all reviews
                  </button>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  )
}
