import type { MetaFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { SectionTitle } from '~/components/typography'
import { Button } from '~/components/ui/button'
import UserCard from '~/components/user-card'
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
          _count: {
            select: {
              schedules: true,
            },
          },
          image: true,
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
    skip: Math.floor(Math.random() * 10),
  })
  return users
}

export default function Index() {
  const users = useLoaderData<typeof loader>()
  return (
    <div className="py-10">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row">
        <div>
          <h1 className="text-6xl font-extrabold">
            Find and Book Your Doctor&apos;s Appointment
          </h1>
          <p className="text-xxl mt-6 font-medium">
            Take control of your health with our user-friendly platform. Search
            for doctors in your area, check their availability, and book
            appointments—all in one place.
          </p>

          <p className="text-xxl mt-2 font-medium">
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
          <p className="text-xxl mt-6 w-3/4">
            Browse through a comprehensive list of certified and experienced
            doctors across various specialties. Read patient reviews and ratings
            to choose the best healthcare professional for your needs.
          </p>
          <ul className="mt-6 grid grid-cols-4 items-stretch gap-6">
            {users.map(({ id, username, doctor, fullName }) => (
              <UserCard
                key={id}
                username={username}
                doctor={doctor}
                fullName={fullName}
              />
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-center">
            <Button asChild>
              <Link to="/search">View All Doctors</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 py-20">
        <SectionTitle>Simple and Fast Booking Process</SectionTitle>
        <div className="flex">
          <div className="w-2/3">
            <p className="text-xxl mt-6 w-3/4">
              Schedule appointments with just a few clicks. Our streamlined
              booking system ensures you can find an available slot that fits
              your schedule without any hassle.
            </p>
            <p className="text-xxl mt-6 w-3/4">
              Whether you&apos;re at home or on the go, our platform is fully
              responsive and accessible from any device. Book appointments
              whenever and wherever it&apos;s convenient for you.
            </p>
            <p className="text-xxl mt-6 w-3/4">
              Keep track of your upcoming appointments, reschedule or cancel if
              needed, and receive reminders—all from your personalized
              dashboard.
            </p>
            <Button className="mt-10">Book Appointment Now</Button>
          </div>
          <div className="-ml-10 flex-1">
            <img src="/images/health.png" alt="health" />
          </div>
        </div>
      </section>
    </div>
  )
}
