import { json, LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { Form, Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { PageTitle } from '~/components/typography'
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
import { formatTime, getUpcomingDateSchedules } from '~/utils/schedule'
import { formatDistance } from 'date-fns'

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
    <div className="page-container">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <PageTitle>Doctors</PageTitle>
        <Form
          method="GET"
          action="/search"
          className="mb-1 flex w-full flex-1 flex-col md:flex-row md:items-center"
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
      </div>
      <div className="mt-12 flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-2/3">
          {doctors.map(({ user }) => {
            const doctor = user.doctor
            if (!doctor || !doctor.schedules) return null
            const closestDateSchedules = getUpcomingDateSchedules(
              doctor.schedules,
            )
            return (
              <Link key={user.id} to={`/profile/${user.username}`}>
                <Card className="mb-6">
                  <CardContent className="flex items-start p-6">
                    <Avatar className="relative mr-6 h-24 w-24 overflow-visible">
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
                      <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center rounded-md bg-secondary-foreground px-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span className="text-sm font-medium text-secondary">
                          {doctor.rating}
                        </span>
                      </div>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="mb-2 text-2xl font-semibold">
                        {user.fullName ?? user.username}
                      </h2>
                      <div className="mb-2 flex flex-wrap gap-2">
                        {doctor.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary">
                            {specialty.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-2">
                        {closestDateSchedules.map((schedule, index) => (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="mr-2 inline-block cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                                  {formatTime(schedule?.startTime)} -{' '}
                                  {formatTime(schedule?.endTime)}
                                </div>
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
                          {formatDistance(
                            closestDateSchedules[0]?.date,
                            new Date(),
                            { addSuffix: true },
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
        <div className="h-[calc(100vh-2rem)] w-full lg:sticky lg:top-4 lg:w-1/3">
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
