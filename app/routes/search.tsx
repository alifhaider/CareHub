import { json, LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { Form, Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { Input } from '~/components/ui/input'
import { prisma } from '~/db.server'
import { Card, CardContent } from '~/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { MapPin, Star } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import {
  formatTime,
  getFormattedTimeDifference,
  getUpcomingDateSchedules,
} from '~/utils/schedule'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'

export const meta: MetaFunction = () => {
  return [
    { title: 'Search / CH' },
    { name: 'description', content: 'Search Doctors!' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const query = searchParams.get('s') ?? ''
  const specialtiesQuery = searchParams.get('specialties') ?? ''
  const locationQuery = searchParams.get('location') ?? ''

  //make queries case-insensitive

  const doctors = await prisma.doctor.findMany({
    where: {
      OR: [
        {
          user: {
            username: { contains: query },
            fullName: { contains: query },
          },
        },
        {
          schedules: {
            some: {
              location: {
                OR: [
                  { name: { contains: query || locationQuery } },
                  { address: { contains: query || locationQuery } },
                ],
              },
            },
          },
        },
        {
          specialties: {
            some: { name: { contains: query || specialtiesQuery } },
          },
        },
      ],
    },
    include: {
      user: {
        include: {
          doctor: {
            select: {
              bio: true,
              image: true,
              rating: true,
              schedules: {
                select: {
                  id: true,
                  date: true,
                  startTime: true,
                  endTime: true,
                  serialFee: true,
                  visitFee: true,
                  discountFee: true,
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
              specialties: { select: { id: true, name: true } },
              _count: { select: { schedules: true } },
            },
          },
        },
      },
    },
  })

  return json({ doctors })
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const { doctors } = useLoaderData<typeof loader>()

  return (
    <div className="">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* <div className="w-full lg:w-2/3">
          <Form
            method="GET"
            action="/search"
            className="sticky top-20 z-10 mb-1 flex w-full flex-1 flex-col md:flex-row md:items-center"
          >
            <Input
              name="s"
              type="search"
              className="w-full rounded-b-none rounded-t-3xl focus-visible:ring-offset-0 md:w-1/2 md:rounded-l-3xl md:rounded-r-none"
              placeholder="Search for doctors, specialties, and more"
              defaultValue={searchParams.get('s') ?? ''}
            />
            <div className="flex flex-1">
              <Input
                name="specialties"
                type="search"
                className="w-1/2 rounded-r-none rounded-es-3xl rounded-ss-none focus-visible:ring-offset-0 md:rounded-none"
                placeholder="Specialty"
              />

              <Input
                name="location"
                type="search"
                className="w-1/2 rounded-l-none rounded-ee-3xl rounded-se-none focus-visible:ring-offset-0 md:rounded-r-3xl"
                placeholder="Location"
              />
            </div>
          </Form>
          <div className="h-6" />
          {doctors.map(({ user }) => {
            const doctor = user.doctor
            if (!doctor || !doctor.schedules) return null
            const upcomingSchedules = getUpcomingDateSchedules(doctor.schedules)

            if (upcomingSchedules.length === 0) return null

            const nextSchedule = upcomingSchedules[0]

            const formattedDateDifference = getFormattedTimeDifference(
              nextSchedule.date,
              nextSchedule.startTime,
              upcomingSchedules[upcomingSchedules.length - 1].endTime,
            )
            return (
              <Card className="mb-6" key={user.id}>
                <CardContent className="flex flex-col items-start gap-2 p-2 md:flex-row md:p-6">
                  <Avatar className="relative mr-6 h-12 w-12 overflow-visible md:h-24 md:w-24">
                    {doctor.image && (
                      <AvatarImage
                        className="h-full w-full rounded-full object-cover"
                        src={doctor.image}
                        alt={user.fullName ?? user.username}
                      />
                    )}
                    <AvatarFallback>
                      {user?.fullName
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                    <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center justify-center gap-1 rounded-md bg-secondary-foreground px-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span className="text-xs font-medium text-secondary md:text-sm">
                        {doctor.rating}
                      </span>
                    </div>
                  </Avatar>
                  <div className="flex-1">
                    <Link
                      to={`/profile/${user.username}`}
                      className="hover:text-accent-foreground/80"
                    >
                      <h2 className="mb-2 text-lg font-semibold md:text-2xl">
                        {user.fullName ?? user.username}{' '}
                      </h2>
                    </Link>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {doctor.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary">
                          {specialty.name}
                        </Badge>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {upcomingSchedules.map((schedule, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                to={`/profile/${user.username}/schedule/${schedule.id}`}
                              >
                                <div className="mr-2 inline-block cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                                  {formatTime(schedule?.startTime)} -{' '}
                                  {formatTime(schedule?.endTime)}
                                </div>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="flex items-center">
                                <MapPin className="mr-1" size={16} />
                                {schedule?.location.name}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      <span className="text-sm text-gray-500">
                        {formattedDateDifference}
                      </span>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-primary">
                        {doctor.bio ?? 'No bio available'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div> */}
        <div className="sticky top-0 z-50 bg-white shadow-md">
          <div className="container mx-auto p-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              {/* Location Input */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative w-full sm:w-1/3">
                    <input
                      type="text"
                      // value={location}
                      // onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, address, or current location"
                      className="w-full rounded-md border p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-3 text-gray-500">
                      📍
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="flex flex-col space-y-2">
                    <button className="rounded p-2 hover:bg-gray-200">
                      Current Location
                    </button>
                    <button className="rounded p-2 hover:bg-gray-200">
                      Anywhere
                    </button>
                    <button className="rounded p-2 hover:bg-gray-200">
                      Keraniganj, Dhaka Division
                    </button>
                    <button className="rounded p-2 hover:bg-gray-200">
                      Los Angeles
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Doctor Name Input */}
              <div className="relative w-full sm:w-1/3">
                <input
                  type="text"
                  // value={doctorName}
                  // onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Doctor Name"
                  className="w-full rounded-md border p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-3 text-gray-500">👨‍⚕️</span>
              </div>

              {/* Specialty Input */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative w-full sm:w-1/3">
                    <input
                      type="text"
                      // value={specialty}
                      // onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Specialty"
                      className="w-full rounded-md border p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-3 text-gray-500">
                      🩺
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="flex flex-col space-y-2">
                    <button className="rounded p-2 hover:bg-gray-200">
                      Cardiologist
                    </button>
                    <button className="rounded p-2 hover:bg-gray-200">
                      Dentist
                    </button>
                    <button className="rounded p-2 hover:bg-gray-200">
                      General Physician
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <div className="right-0 hidden h-[calc(100vh-6rem)] md:block lg:fixed lg:top-20 lg:w-1/3">
          <div className="flex h-full items-center justify-center rounded-lg bg-gray-200 p-4">
            <p className="text-lg font-semibold text-gray-600">
              Google Map Placeholder
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
