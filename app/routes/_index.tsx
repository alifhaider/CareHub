import type { MetaFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import Reminder from '~/components/reminder'
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
    <>
      <section className="mx-auto flex flex-col gap-10 md:flex-row">
        <div className="container space-y-4">
          <h1 className="text-4xl font-extrabold md:text-6xl">
            Find and Book Your Doctor&apos;s Appointment
          </h1>
          <p className="mt-6 font-medium">
            Take control of your health with our user-friendly platform. Search
            for doctors in your area, check their availability, and book
            appointments—all in one place.
          </p>

          <p className="font-medium">
            Schedule appointments with just a few clicks. Our streamlined
            booking system ensures you can find an available slot that fits your
            schedule without any hassle.
          </p>
        </div>
        <div className="h-80 w-full max-w-5xl bg-primary-foreground">Image</div>
      </section>
      <section className="mt-20 bg-primary-foreground py-20">
        <div className="container">
          <SectionTitle>Search for Top-Rated Doctors</SectionTitle>
          <p className="mt-6 w-3/4">
            Browse through a comprehensive list of certified and experienced
            doctors across various specialties. Read patient reviews and ratings
            to choose the best healthcare professional for your needs.
          </p>
          <ul className="mt-6 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="px-4">
          <SectionTitle>Simple and Fast Booking Process</SectionTitle>
        </div>
        <div className="flex flex-col-reverse md:flex-row">
          <div className="w-full px-4 md:w-2/3">
            <p className="mt-6 md:w-3/4">
              Schedule appointments with just a few clicks. Our streamlined
              booking system ensures you can find an available slot that fits
              your schedule without any hassle.
            </p>
            <p className="mt-6 md:w-3/4">
              Whether you&apos;re at home or on the go, our platform is fully
              responsive and accessible from any device. Book appointments
              whenever and wherever it&apos;s convenient for you.
            </p>
            <p className="mt-6 md:w-3/4">
              Keep track of your upcoming appointments, reschedule or cancel if
              needed, and receive reminders—all from your personalized
              dashboard.
            </p>
            <Button className="mt-10">Book Appointment Now</Button>
          </div>
          <div className="flex-1">
            <img src="/images/health.png" alt="health" />
          </div>
        </div>
      </section>

      <Reminder />
    </>
  )
}
