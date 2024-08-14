import type { MetaFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Star } from 'lucide-react'
import { SectionTitle } from '~/components/typography'
import { Button } from '~/components/ui/button'
import { prisma } from '~/db.server'

export const meta: MetaFunction = () => {
  return [
    { title: 'Home / CH' },
    { name: 'description', content: 'Welcome to Remix!' },
  ]
}

export async function loader() {
  const users = await prisma.user.findMany({
    where: {
      doctor: {
        isNot: null,
      },
    },
    include: {
      doctor: {
        select: {
          fullName: true,
          bio: true,
          rating: true,
          specialties: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    take: 8,
  })
  return users
}

export default function Index() {
  const users = useLoaderData<typeof loader>()
  return (
    <div className="font-sans py-10">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row">
        <div>
          <h1 className="text-6xl font-extrabold">
            Find and Book Your Doctor&apos;s Appointment
          </h1>
          <p className="mt-6 text-xl font-medium">
            Take control of your health with our user-friendly platform. Search
            for doctors in your area, check their availability, and book
            appointments—all in one place.
          </p>

          <p className="mt-2 text-xl font-medium">
            Schedule appointments with just a few clicks. Our streamlined
            booking system ensures you can find an available slot that fits your
            schedule without any hassle.
          </p>
        </div>
        <div className="h-80 w-[1000px] bg-primary-foreground">Image</div>
      </section>
      <section className="mt-20 bg-primary-foreground py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle>Search for Top-Rated Doctors</SectionTitle>
          <p className="mt-6 w-3/4 text-xl">
            Browse through a comprehensive list of certified and experienced
            doctors across various specialties. Read patient reviews and ratings
            to choose the best healthcare professional for your needs.
          </p>
          <ul className="mt-6 grid grid-cols-4 items-stretch gap-6">
            {users.map(({ id, username, doctor }) => (
              <li key={id} className='h-full'>
                <Link to={`/users/${username}`}>
                  <div  className="rounded-sm border bg-background hover:shadow-lg py-2 h-full">
                  <div className="mx-auto h-20 w-20 rounded-sm bg-secondary"></div>
                  <h3 className="mt-2 flex items-end justify-center px-4 text-lg font-semibold">
                    {doctor?.fullName ?? username}
                    <span className="flex items-center text-sm font-normal">
                      /<Star className="mx-0.5 h-3 w-3 text-lime-400" />
                      {doctor?.rating}
                    </span>
                  </h3>
                  <ul className="flex mt-4 flex-wrap justify-between text-sm">
                    {doctor?.specialties.map(specialty => (
                            <li
                        key={specialty.id}
                        className="flex items-center gap-1 px-4"
                      >
                        <div className="h-2 w-2 rounded-full bg-amber-300"></div>
                        {specialty.name}
                      </li>
                    ))}
                    </ul>
                    </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-center">
            <Button>View All Doctors</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 py-20">

        <SectionTitle>Simple and Fast Booking Process</SectionTitle>
        <div className='flex'>
          <div className='w-2/3'>
            
        <p className="mt-6 w-3/4 text-xl">
          Schedule appointments with just a few clicks. Our streamlined booking
          system ensures you can find an available slot that fits your schedule
          without any hassle.
        </p>
        <p className="mt-6 w-3/4 text-xl">
          Whether you&apos;re at home or on the go, our platform is fully
          responsive and accessible from any device. Book appointments whenever
          and wherever it&apos;s convenient for you.
        </p>
        <p className="mt-6 w-3/4 text-xl">
          Keep track of your upcoming appointments, reschedule or cancel if
          needed, and receive reminders—all from your personalized dashboard.
        </p>
          <Button className='mt-10'>Book Appointment Now</Button>
</div>
          <div className='flex-1 -ml-10'>

          <img src="/images/health.png" alt="health" />
          </div>
        </div>
      </section>
    </div>
  )
}
