import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { format } from 'date-fns'
import { MapPin, Settings, StarIcon } from 'lucide-react'
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
import {
  formatTime,
  getUpcomingDateSchedules,
  TSchedule,
} from '~/utils/schedule'

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
            select: { user: { select: { username: true, fullName: true } } },
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
  const schedules = user.doctor?.schedules ?? []

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

  // Filter out schedules for the nearest day
  const upcomingSchedules = getUpcomingDateSchedules(schedules)

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
    <>
      <Spacer variant="lg" />

      <div className="container">
        <div className="flex gap-6">
          {user.doctor?.image ? (
            <img
              src={user.doctor?.image}
              alt={user.username}
              className="h-32 w-32 rounded-sm shadow-sm"
            />
          ) : (
            <img
              src="/placeholder.svg"
              alt={user.username}
              className="h-32 w-32 rounded-sm bg-primary-foreground shadow-sm"
            />
          )}

          <div className="w-full">
            <div className="flex items-center justify-between">
              <SectionTitle>{user.fullName ?? user.username}</SectionTitle>
              {isDoctor && isOwner ? (
                <Button asChild variant="outline">
                  <Link to="/profile/edit" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Profile Settings
                  </Link>
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
        <Spacer variant="md" />
        <p>{user.doctor?.bio}</p>
      </div>

      {isDoctor ? (
        <>
          <Spacer variant="lg" />
          <div className="container flex flex-col gap-10 md:flex-row">
            <div>
              <Calendar
                onSelect={handleDateClick}
                components={{
                  Day: (props: DayProps) => (
                    <CustomCell scheduleTimes={scheduleTimes} {...props} />
                  ),
                }}
                formatters={{
                  formatCaption: (date: Date) => format(date, 'MMMM yyyy'),
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

      <Spacer variant="lg" />
      {isDoctor ? <Reviews /> : null}
      <Spacer variant="lg" />
    </>
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

type ScheduleProps = {
  schedules: TSchedule[] | undefined
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
  return (
    <div className="flex-1">
      {schedules && schedules?.length > 0 && (
        <div className="relative flex items-center">
          <span className="h-0.5 w-full border"></span>
          <h5 className="mx-1 text-nowrap text-4xl font-bold text-secondary-foreground">
            {format(schedules[0].date ?? new Date(), 'dd MMMM, yyyy')}
          </h5>
          <span className="h-0.5 w-full border"></span>
        </div>
      )}
      <Spacer variant="sm" />

      {schedules && schedules?.length === 0 ? (
        <p className="text-lg text-accent-foreground">No available schedules</p>
      ) : null}

      <ul className="max-h-[40rem] space-y-4 overflow-y-auto">
        {schedules?.map(schedule => (
          <li
            key={schedule.id}
            className="flex items-center rounded-md border transition-all"
          >
            <div className="h-full w-full px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <MapPin className="h-8 w-8" />
                  <div>
                    <h6 className="flex items-end text-2xl font-bold leading-none">
                      {schedule.location.name}
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
                          to={`/profile/${username}/schedule/${schedule.id}`}
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
                  <div className="font-bold text-accent-foreground">
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
  const overallRating = 4.8
  const totalReviews = 2489
  const reviews = [
    {
      id: 1,
      author: 'Sarah Johnson',
      avatar: '/placeholder.svg',
      rating: 5,
      date: 'February 02, 2024',
      comment:
        'Dr. Smith was incredibly thorough and patient. He took the time to explain everything in detail and answer all my questions. The appointment scheduling was smooth, and the wait time was minimal.',
      verified: true,
    },
    {
      id: 2,
      author: 'Michael Chen',
      avatar: '/placeholder.svg',
      rating: 1,
      date: 'January 2024',
      comment:
        'Very professional and knowledgeable. The online booking system was convenient, and the staff was friendly and helpful. Would definitely recommend!',
      verified: true,
    },
    {
      id: 3,
      author: 'Emily Williams',
      avatar: '/placeholder.svg',
      rating: 4,
      date: 'January 2024',
      comment:
        'Good experience overall. The doctor was knowledgeable and professional. The only minor issue was a slight delay in the appointment time.',
      verified: true,
    },
  ]
  return (
    <div className="container">
      <h4 className="text-sm font-extrabold">RATINGS AND REVIEWS</h4>

      <p className="flex items-center gap-2 text-6xl font-extrabold">
        {overallRating}
        <span>
          <StarIcon className="h-6 w-6 fill-cyan-400 stroke-cyan-400" />
        </span>
      </p>

      <p className="mt-1 text-sm">
        &#40;
        {totalReviews} {Number(totalReviews) > 1 ? 'Ratings' : 'Rating'}&#41;
      </p>

      <Spacer variant="md" />

      <h6 className="text-sm font-extrabold uppercase text-secondary-foreground">
        Reviews
      </h6>
      <ul className="max-w-4xl py-2">
        {reviews.map(review => (
          <li
            key={review.id}
            className="flex items-start gap-4 border-b py-6 first:pt-0"
          >
            <div className="h-10 w-10 rounded-full bg-primary-foreground" />
            <div className="flex-1 space-y-4">
              <div className="flex gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i}>
                    <StarIcon
                      className={`h-5 w-5 ${review.rating > i && 'fill-cyan-400'} stroke-cyan-400`}
                    />
                  </span>
                ))}
              </div>
              <p className="font-montserrat text-xs font-semibold text-secondary-foreground">
                {review.author}
                <span className="ml-2 text-[11px] font-medium text-muted-foreground">
                  {review.date}
                </span>
              </p>

              <p className="text-sm text-secondary-foreground">
                {review.comment}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Spacer variant="md" />
      <div className="flex max-w-4xl items-center justify-center">
        <Button asChild variant="default">
          <Link to="/reviews">See More</Link>
        </Button>
      </div>
    </div>
  )
}
