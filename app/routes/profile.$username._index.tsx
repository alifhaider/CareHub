import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { MapPin } from 'lucide-react'
import { Spacer } from '~/components/spacer'
import { PageTitle, SectionTitle } from '~/components/typography'
import { Button } from '~/components/ui/button'
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

type Location = {
  id: string
  address: string
  name: string
  city: string | null
  state: string | null
  zip: string | null
}

type GroupedSchedule = {
  id: string
  location: Location
  times: {
    day: string
    startTime: string
    endTime: string
    maxAppointments: number
  }[]
}

// appointments
// {location: 'ibna sina hospital', day: 'Monday', startTime: '9:00', endTime: '12:00'}
// {location: 'ibna sina hospital', day: 'Monday', startTime: '13:00', endTime: '17:00'}
// {location: 'ibna sina hospital', day: 'Tuesday', startTime: '9:00', endTime: '12:00'}
// {location: 'ibna sina hospital', day: 'Tuesday', startTime: '13:00', endTime: '17:00'}
// i want output like this
// {location: 'ibna sina hospital', day: 'Monday', startTime: '9:00', endTime: '12:00'}
// {location: 'ibna sina hospital', day: 'Monday', startTime: '13:00', endTime: '17:00'}

//   const mockData = [
//     {
//       "location": {
//         "id": "clztvw8om004gv802suqqe2j4",
//         "address": "House- 01, Road- 04, Dhanmondi, Dhaka 1205",
//         "name": "Labaid Hospital",
//         "city": "Dhaka",
//         "state": "Dhaka",
//         "zip": "1205"
//       },
//       "times": [
//         {
//           "day": "WEDNESDAY",
//           "startTime": "2024-08-14T03:00:00.000Z",
//           "endTime": "2024-08-14T11:00:00.000Z",
//           "maxAppointments": 5
//         },
//         {
//           "day": "SATURDAY",
//           "startTime": "2024-08-14T03:00:00.000Z",
//           "endTime": "2024-08-14T11:00:00.000Z",
//           "maxAppointments": 6
//         }
//       ]
//     },
//     {
//       "location": {
//         "id": "clztvw8om004jv802djp3ampi",
//         "address": "18/F West Panthapath, Dhaka 1205",
//         "name": "Square Hospital",
//         "city": "Dhaka",
//         "state": "Dhaka",
//         "zip": "1205"
//       },
//       "times": [
//         {
//           "day": "TUESDAY",
//           "startTime": "2024-08-14T03:00:00.000Z",
//           "endTime": "2024-08-14T11:00:00.000Z",
//           "maxAppointments": 5
//         }
//       ]
//     }
// ]

export async function loader({ request, params }: LoaderFunctionArgs) {
  const username = params.username
  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
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
          doctor: { select: { user: { select: { username: true } } } },
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
  // const [showInput, setShowInput] = useState(false)
  const { isDoctor, isOwner, user } = useLoaderData<typeof loader>()

  function groupSchedulesByLocation() {
    const schedules = user.doctor?.schedules ?? []
    const groupedByLocation = schedules?.reduce<
      Record<string, GroupedSchedule>
    >((acc, schedule) => {
      const locationId = schedule.location.id

      if (!acc[locationId]) {
        acc[locationId] = {
          id: schedule.id,
          location: schedule.location,
          times: [],
        }
      }

      acc[locationId].times.push({
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        maxAppointments: schedule.maxAppointments,
      })

      return acc
    }, {})

    return Object.values(groupedByLocation)
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

      <Spacer variant="md" />
      {isDoctor ? (
        <>
          <h2 className="mb-4 text-5xl font-bold underline">
            Book Appointment
          </h2>
          <ul className="space-y-4">
            {groupSchedulesByLocation()?.map(schedule => (
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
                          <span className="text-sm font-normal">
                            /
                            {schedule.times.map(time => {
                              return (
                                <span key={time.startTime}>
                                  {time.day} ({getHours(time.startTime)}-
                                  {getHours(time.endTime)})
                                </span>
                              )
                            })}
                          </span>
                        </h6>
                        <div className="mt-2 text-sm text-accent-foreground">
                          {schedule.location.address}, {schedule.location.city},{' '}
                          {schedule.location.state}, {schedule.location.zip}
                        </div>
                        <div className="mt-4">
                          {!isOwner && (
                            <Link
                              to={`/profile/${user.username}/book`}
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
                    <div className="text-xl font-bold">Fee: 2000tk</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {isDoctor && isOwner ? (
        <Button asChild variant="outline" className="mt-6">
          <Link to="/add/schedule">Create a new Schedule</Link>
        </Button>
      ) : null}

      <Spacer variant="md" />
      {isOwner ? (
        <>
          <h2 className="text-3xl font-medium text-lime-500">
            Booked Appointments
          </h2>
          <ul>
            {user.bookings.map(appointment => (
              <li key={appointment.id}>
                {appointment.date} |{' '}
                <Link to={`/profile/${appointment.doctor.user.username}`}>
                  {appointment.doctor.user.username}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
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
