import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { Spacer } from "~/components/spacer";
import { PageTitle } from "~/components/typography";
import { prisma } from "~/db.server";
import { formatTime } from "~/utils/misc";

export async function loader({ params }: LoaderFunctionArgs) {
  const username = params.username;
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    include: {
      doctor: {
        include: {
          schedules: {
            include: {
              location: true,
            },
          },
        },
      },
      bookings: true,
    },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return json({ user });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.user.username}/CareHub` },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function User() {
  const [showInput, setShowInput] = useState(false);
  const data = useLoaderData<typeof loader>();
  const isDoctor = data.user?.doctor !== null;

  return (
    <div>
      <PageTitle>
        <span className="underline">Username:</span> {data.user.username}
      </PageTitle>

      <Spacer variant="sm" />
      <p>
        Role: {isDoctor ? "Doctor" : "User"} &#40;
        {isDoctor && data.user?.doctor?.specialty}&#41;
      </p>

      <Spacer variant="md" />
      <h2 className="text-3xl font-medium text-lime-500">
        Upcoming Appointments
      </h2>
      <ul>
        {data.user.bookings.map((appointment) => (
          <li key={appointment.id}>{appointment.date} | { appointment.doctorId}</li>
        ))}
      </ul>

      <Spacer variant="md" />
      <h2 className="text-3xl font-medium text-lime-500 mb-4">Schedules</h2>
      <ul>
        {data.user.doctor?.schedules.map((schedule) => (
          <li key={schedule.id} className="flex items-center">
            <span>
              {showInput ? (
                <></>
              ) : (
                <>
                  {schedule.day} | {formatTime(schedule.startTime)} -{" "}
                  {formatTime(schedule.endTime)} | {schedule.location.name}
                </>
              )}
            </span>
            <div className="flex gap-2 items-center">
              <button
                className="text-xs ml-10 underline text-cyan-400"
                onClick={(e) => {
                  e.preventDefault();
                  setShowInput(true);
                }}
              >
                Edit
              </button>
              <span>|</span>
              <button className="text-xs underline text-amber-500">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {isDoctor ? (
        <Link to="/add/schedule">Add Schedule</Link>
      ) : (
        <>
          <Link to="/add/appointment">Add Appointment</Link>
        </>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="container mx-auto flex items-center justify-center p-20 text-h2">
      <PageTitle>404</PageTitle>
      <p className="text-center">User not found</p>
    </div>
  );
}
