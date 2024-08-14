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
      <section className="flex gap-10 flex-col md:flex-row max-w-7xl mx-auto">
        <div>
          <h1 className="text-6xl font-extrabold">
            Find and Book Your Doctor&apos;s Appointment
          </h1>
          <p className="mt-6 font-medium text-xl">
            Take control of your health with our user-friendly platform. Search
            for doctors in your area, check their availability, and book
            appointments—all in one place.
          </p>

          <p className="mt-2 font-medium text-xl">
            Schedule appointments with just a few clicks. Our streamlined
            booking system ensures you can find an available slot that fits your
            schedule without any hassle.
          </p>
        </div>
        <div className="w-[1000px] h-80 bg-primary-foreground">Image</div>
      </section>
      <section className="mt-20 bg-primary-foreground py-20">
        <div className="max-w-7xl mx-auto">
          <SectionTitle>Search for Top-Rated Doctors</SectionTitle>
          <p className="text-xl mt-6 w-3/4">
            Browse through a comprehensive list of certified and experienced
            doctors across various specialties. Read patient reviews and ratings
            to choose the best healthcare professional for your needs.
          </p>
          <ul className="grid grid-cols-4 gap-6 mt-6">
            {users.map(({ id, username, doctor }) => (
              <li key={id} className="border rounded-sm py-2 bg-background">
                <Link to={`/users/${username}`} className="min-w-44 min-h-44">
                  <div className="w-20 mx-auto h-20 bg-secondary rounded-sm"></div>
                  <h3 className="text-lg font-semibold mt-2 px-4 flex items-end justify-center">
                    {username}{' '}
                    <span className="text-sm font-normal flex gap-1 items-center">
                      /<Star className="h-3 w-3" />
                      {doctor?.rating}
                    </span>
                  </h3>
                  <ul className="text-sm flex flex-wrap justify-between">
                    {doctor?.specialties.map(specialty => (
                      <li
                        key={specialty.id}
                        className="flex gap-1 items-center px-4"
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-300"></div>
                        {specialty.name}
                      </li>
                    ))}
                  </ul>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-center mt-8">
            <Button>View All Doctors</Button>
          </div>
        </div>
      </section>

      <section className="py-20 space-y-6 max-w-7xl mx-auto">
        <SectionTitle>Simple and Fast Booking Process</SectionTitle>
        <p className="text-xl mt-6 w-3/4">
          Schedule appointments with just a few clicks. Our streamlined booking
          system ensures you can find an available slot that fits your schedule
          without any hassle.
        </p>
        <p className="text-xl mt-6 w-3/4">
          Whether you&apos;re at home or on the go, our platform is fully
          responsive and accessible from any device. Book appointments whenever
          and wherever it&apos;s convenient for you.
        </p>
        <p className="text-xl mt-6 w-3/4">
          Keep track of your upcoming appointments, reschedule or cancel if
          needed, and receive reminders—all from your personalized dashboard.
        </p>
        <Button>Book Appointment Now</Button>
      </section>
    </div>
  )
}
