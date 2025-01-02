import { json, LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { Form, Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { Input } from '~/components/ui/input'
import { prisma } from '~/db.server'
import { Card, CardContent } from '~/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import {
  ArrowDown,
  ChevronDown,
  FilterIcon,
  MapPin,
  SlidersHorizontal,
  Star,
} from 'lucide-react'
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
import SearchNavbar from '~/components/search-navbar'
import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { z } from 'zod'
import { Button } from '~/components/ui/button'

export const meta: MetaFunction = () => {
  return [
    { title: 'Search / CH' },
    { name: 'description', content: 'Search Doctors!' },
  ]
}

export const SearchPageSchema = z.object({
  locationId: z.string().optional(),
  from: z.date().optional(),
  to: z.date().optional(),
})

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

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SearchPageSchema })
    },
    shouldRevalidate: 'onSubmit',
  })

  return (
    <div className="flex h-screen w-full flex-col">
      <Form method="GET" action="/search" className="sticky top-0 z-50">
        <SearchNavbar
          locationField={fields.locationId}
          fromField={fields.from}
          toField={fields.to}
        />
        <Filters />
      </Form>

      <div className="flex divide-x overflow-y-hidden">
        <div className="flex-1 overflow-y-auto shadow-md">
          <div className="container mx-auto h-full overflow-y-scroll p-4">
            <div className="h-screen"></div>
          </div>
        </div>
        <div className="w-full flex-1">
          <div className="flex h-full items-center justify-center bg-gray-500 p-4">
            <p className="text-lg font-semibold">Google Map Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const FilterWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Button
      variant="outline"
      className="flex h-8 items-center gap-2 rounded-lg px-[11px] py-[7px]"
    >
      {children}
    </Button>
  )
}

const Filters = () => {
  return (
    <div className="flex items-center gap-2 bg-background px-4 py-2 shadow-sm">
      <FilterWrapper>
        <SlidersHorizontal
          width={16}
          height={16}
          className="text-muted-foreground"
        />
        <div className="sr-only">Filters</div>
      </FilterWrapper>

      <FilterItem />
      <FilterItem />
      <FilterItem />
    </div>
  )
}

const FilterItem = () => {
  return (
    <FilterWrapper>
      <span className="text-xs font-bold text-accent-foreground">
        Doctor Type
      </span>
      <ChevronDown width={16} height={16} />
    </FilterWrapper>
  )
}
