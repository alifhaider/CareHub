import {
  data,
  MetaFunction,
  useSearchParams,
  useSubmit,
  Form,
} from 'react-router'
import { prisma } from '~/db.server'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import SearchNavbar from '~/components/search-navbar'
import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Route } from './+types/search'

export const meta: MetaFunction = () => {
  return [
    { title: 'Search / CH' },
    { name: 'description', content: 'Search Doctors!' },
  ]
}

export const SearchPageSchema = z.object({
  name: z.string().optional(),
  locationId: z.string().optional(),
  specialtyId: z.string().optional(),
})

export async function loader({ request }: Route.LoaderArgs) {
  const searchParams = new URL(request.url).searchParams
  const query = searchParams.get('s') ?? ''
  const nameQuery = searchParams.get('name') ?? ''
  const specialtiesQuery = searchParams.get('specialty') ?? ''
  const locationQuery = searchParams.get('location') ?? ''

  console.log('query', query, nameQuery, specialtiesQuery, locationQuery)

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

  return data({ doctors })
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: SearchPageSchema })

  if (submission.status !== 'success') {
    return data(submission.reply({ formErrors: ['Could not submit search'] }))
  }
}

export default function Search({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const submit = useSubmit()
  const { doctors } = loaderData

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SearchPageSchema })
    },
    shouldRevalidate: 'onSubmit',
  })

  return (
    <div className="flex h-screen w-full flex-col">
      <Form
        method="get"
        className="sticky top-0 z-50"
        onChange={event => {
          event.preventDefault()
          console.log('submit')
          submit(event.currentTarget)
        }}
      >
        <SearchNavbar
          nameField={fields.name}
          locationField={fields.locationId}
          specialtyField={fields.specialtyId}
        />
        <Filters />
        <button type="submit" className="hidden" />
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
