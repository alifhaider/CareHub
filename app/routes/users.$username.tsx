import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { Spacer } from "~/components/spacer";
import { PageTitle } from "~/components/typography";
import { Calendar } from "~/components/ui/calendar";
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
      bookings: {
        include: {
          doctor: {
            select: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return json({ user });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.user.username} / CH` },
    { name: "description", content: `CareHub ${data?.user.username} Profile!` },
  ];
};

export default function User() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showInput, setShowInput] = useState(false);
  const data = useLoaderData<typeof loader>();
  const isDoctor = data.user?.doctor || false;

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
        Booked Appointments
      </h2>
      <ul>
        {data.user.bookings.map((appointment) => (
          <li key={appointment.id}>
            {appointment.date} |{" "}
            <Link to={`/users/${appointment.doctor.user.username}`}>
              {appointment.doctor.user.username}
            </Link>
          </li>
        ))}
      </ul>

      <Spacer variant="md" />
      {data.user.doctor ? (
        <>
          <div className="flex items-center gap-2 text-foreground">
            <h2 className="text-4xl font-semibold text- mb-4">
              Schedules
            </h2>
            <p className="text-sm text-accent-foreground">
              (You can book any of the schedule)
            </p>
          </div>

          <Calendar
    mode="single"
    selected={date}
    onSelect={setDate}
    className="rounded-md border"
  />
          <div>
            <ul className="flex items-center"></ul>
          </div>
          <ul>
            {data.user.doctor?.schedules.map((schedule) => (
              <li key={schedule.id} className="flex items-center">
                <span>
                  {showInput ? (
                    <>Didn&apos;t set any input fields yet</>
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
                      setShowInput(t => !t);
                    }}
                  >
                    {showInput ? "Cancel" : "Edit"}
                  </button>
                  <span>|</span>
                  <button className="text-xs underline text-amber-500">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

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
