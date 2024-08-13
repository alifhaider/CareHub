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
import { authSessionStorage } from "~/services/session.server";
import { formatTime, invariantResponse } from "~/utils/misc";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const username = params.username;
  const cookieSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  const loggedInUserId = cookieSession.get("userId");
  const user = await prisma.user.findFirst({
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

  invariantResponse(user, "User not found", { status: 404 });
  const isOwner = user?.id === loggedInUserId;
  const isDoctor = user?.doctor || false;

  return json({ user, isOwner, isDoctor });
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
  const { isDoctor, isOwner, user } = useLoaderData<typeof loader>();

  return (
    <div className="py-10">
      <div className="flex gap-10">
        <div className="w-32 h-32 bg-primary-foreground rounded-sm shadow-sm" />
        <PageTitle>@{user.username}</PageTitle>
      </div>

      <Spacer variant="sm" />
      <p>
        Role: {isDoctor ? "Doctor" : "User"} &#40;
        {isDoctor && user?.doctor?.specialty}&#41;
      </p>

      <Spacer variant="md" />
      <h2 className="text-3xl font-medium text-lime-500">
        Booked Appointments
      </h2>
      <ul>
        {user.bookings.map((appointment) => (
          <li key={appointment.id}>
            {appointment.date} |{" "}
            <Link to={`/users/${appointment.doctor.user.username}`}>
              {appointment.doctor.user.username}
            </Link>
          </li>
        ))}
      </ul>

      <Spacer variant="md" />
      {isDoctor ? (
        <>
          <h2 className="text-5xl font-semibold underline mb-4">
            Available Schedules
          </h2>

          <ul>
            {user.doctor?.schedules.map((schedule) => (
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
                {isOwner && (
                  <div className="flex gap-2 items-center">
                    <button
                      className="text-xs ml-10 underline text-cyan-400"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowInput((t) => !t);
                      }}
                    >
                      {showInput ? "Cancel" : "Edit"}
                    </button>
                    <span>|</span>
                    <button className="text-xs underline text-amber-500">
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </>
      ) : null}

      {isDoctor && isOwner ? (
        <Link to="/add/schedule">Add Schedule</Link>
      ) : null}
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
