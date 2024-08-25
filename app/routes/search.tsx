import { json, LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { Form, useLoaderData, useSearchParams } from '@remix-run/react'
import { PageTitle } from '~/components/typography'
import { Input } from '~/components/ui/input'
import { prisma } from '~/db.server'
import UserCard from '~/components/user-card'

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
  const users = await prisma.doctor.findMany({
    where: {
      OR: [
        {
          fullName: { contains: query },
          user: { username: { contains: query } },
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
              fullName: true,
              bio: true,
              rating: true,
              specialties: { select: { id: true, name: true } },
              _count: { select: { schedules: true } },
            },
          },
        },
      },
    },
  })
  return json({ users })
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const { users } = useLoaderData<typeof loader>()
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
      <ul className="mt-6 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:grid-cols-4">
        {users.map(({ id, user }) => (
          <UserCard key={id} doctor={user.doctor} username={user.username} />
        ))}
      </ul>
    </div>
  )
}
