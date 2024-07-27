import { json, LoaderFunctionArgs } from "@remix-run/node";
import {  Link, useLoaderData } from "@remix-run/react";
import { Spacer } from "~/components/spacer";
import { PageTitle } from "~/components/typography";
import { prisma } from "~/db.server";

export async function loader({  params }: LoaderFunctionArgs) {
  const username = params.username;
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: user.id,
    },
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      userId: doctor?.userId,
    },
  });

  const schedules = await prisma.schedule.findMany({
    where: {
      doctorId: doctor?.userId,
    },
    include: {
      location: true,
    }
  });

  return json({ user, doctor, appointments, schedules });
}

export default function User() {
  const data = useLoaderData<typeof loader>();
  const isDoctor = data.doctor?.speciality;
  return (
    <div>
      <PageTitle>
        <span className="underline">Username:</span> {data.user.username}
      </PageTitle>

<Spacer variant="sm" />
      <p>Role: {isDoctor ? "Doctor" : "User"} &#40;{isDoctor && data.doctor?.speciality}&#41;  </p>

      <Spacer variant="md" />
      <h2 className="text-3xl font-medium text-lime-500">Upcoming Appointments</h2>
      <ul>
        {data.appointments.map((appointment) => (
          <li key={appointment.id}>{appointment.date}</li>
        ))}
      </ul>

      <Spacer variant="md" />
      <h2 className="text-3xl font-medium text-lime-500">Schedules</h2>
      <ul>
        {data.schedules.map((schedule) => (
          <li key={schedule.id}>
            {schedule.day} | {schedule.startTime} - {schedule.endTime} | {schedule.location.name}
          </li>
        ))}
      </ul>

      {isDoctor ? 
        <Link to="/add/schedule">Add Schedule</Link>
        :
        <>
        <Link to="/add/appointment">Add Appointment</Link>
        </>
      }
      
      
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
