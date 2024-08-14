import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { Spacer } from '~/components/spacer'
import { PageTitle, SectionTitle } from '~/components/typography'
import { Calendar } from '~/components/ui/calendar'
import { prisma } from '~/db.server'
import { authSessionStorage } from '~/services/session.server'
import { formatTime, invariantResponse } from '~/utils/misc'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const username = params.username
  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  const loggedInUserId = cookieSession.get('userId')
  const user = await prisma.user.findFirst({
    where: {
      username,
    },
    include: {
      doctor: {
        include: {
          specialties: {
            select: {
              id: true,
              name: true,
            },
          },
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
            select: {
              user: {
                select: {
                  username: true,
                },
              },
            },
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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.user.username} / CH` },
    { name: 'description', content: `CareHub ${data?.user.username} Profile!` },
  ]
}

export default function User() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showInput, setShowInput] = useState(false)
  const { isDoctor, isOwner, user } = useLoaderData<typeof loader>()

  const scheduleLocations = user.doctor?.schedules.map(
    schedule => schedule.location,
  )

  return (
    <div className="mx-auto max-w-7xl py-10">
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
                    <span className="text-sm">({education.year})</span>
                  </li>
                ))}
              </>
            ) : null}
          </ul>
        </div>
      </div>

      <Spacer variant="sm" />

      <Spacer variant="md" />
      <h2 className="text-3xl font-medium text-lime-500">
        Booked Appointments
      </h2>
      <ul>
        {user.bookings.map(appointment => (
          <li key={appointment.id}>
            {appointment.date} |{' '}
            <Link to={`/users/${appointment.doctor.user.username}`}>
              {appointment.doctor.user.username}
            </Link>
          </li>
        ))}
      </ul>

      <Spacer variant="md" />
      {isDoctor ? (
        <>
          <h2 className="mb-4 text-5xl font-bold underline">
            Book Appointment
          </h2>
          <ul>
            {scheduleLocations?.map(location => (
              <li
                key={location.name}
                className="flex items-center rounded-md border transition-all hover:shadow-md"
              >
                <button className="h-full w-full px-4 py-6">
                  <h6 className="flex items-center gap-2 text-2xl font-bold">
                    <MapPin />
                    {location.name}
                  </h6>
                  <span></span>
                  {!isOwner && !isDoctor && (
                    <button className="text-xs text-cyan-400 underline">
                      Book
                    </button>
                  )}
                  {isOwner && (
                    <button className="text-xs text-amber-500 underline">
                      Delete
                    </button>
                  )}
                </button>
              </li>
            ))}
            {user.doctor?.schedules.map(schedule => (
              <li key={schedule.id} className="flex items-center">
                <span>
                  {showInput ? (
                    <>Didn&apos;t set any input fields yet</>
                  ) : (
                    <>
                      {schedule.day} | {formatTime(schedule.startTime)} -{' '}
                      {formatTime(schedule.endTime)} | {schedule.location.name}
                    </>
                  )}
                </span>
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <button
                      className="ml-10 text-xs text-cyan-400 underline"
                      onClick={e => {
                        e.preventDefault()
                        setShowInput(t => !t)
                      }}
                    >
                      {showInput ? 'Cancel' : 'Edit'}
                    </button>
                    <span>|</span>
                    <button className="text-xs text-amber-500 underline">
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </>
      ) : null}

      {isDoctor && isOwner ? (
        <Link to="/add/schedule">Add Schedule</Link>
      ) : null}

      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  )
}

export function ErrorBoundary() {
  return (
    <div className="text-h2 container mx-auto flex items-center justify-center p-20">
      <PageTitle>404</PageTitle>
      <p className="text-center">User not found</p>
    </div>
  )
}
