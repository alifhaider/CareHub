import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { SectionTitle } from "~/components/typography";
import { Button } from "~/components/ui/button";
import { prisma } from "~/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Home / CH" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

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
          specialty: true,
        },
      },
    },
  });
  return users;
}

export default function Index() {
  const users = useLoaderData<typeof loader>();
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
      <section className="mt-10 bg-primary-foreground py-10">
        <div className="max-w-7xl mx-auto">
          <SectionTitle>Search for Top-Rated Doctors</SectionTitle>
          <p className="text-xl mt-6 w-3/4">
            Take control of your health with our user-friendly platform. Search
            for doctors in your area, check their availability, and book
            appointments—all in one place.
          </p>
          <ul className="grid grid-cols-4 gap-10 mt-6">
            {users.map(({ id, username, doctor }) => (
              <li key={id} className="border rounded-sm pb-2">
                <Link to={`/users/${username}`} className="min-w-44 min-h-44">
                  <div className="w-full h-20 bg-secondary rounded-sm"></div>
                  <h3 className="text-lg font-semibold mt-2 px-4">
                    {username}
                  </h3>
                  <p className="px-4">{doctor?.specialty}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10 space-y-6">
        <SectionTitle>Simple and Fast Booking Process</SectionTitle>
        <p className="text-xl mt-6 w-3/4">
          Schedule appointments with just a few clicks. Our streamlined booking
          system ensures you can find an available slot that fits your schedule
          without any hassle.
        </p>
        <Button>Book Appointment Now</Button>
      </section>
    </div>
  );
}
