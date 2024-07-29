import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Home/CareHub" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader() {
  const doctors = await prisma.doctor.findMany();
  const doctorIds = doctors.map((doctor) => doctor.userId);
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: doctorIds,
      },
    },
  });
  return users;
}

export default function Index() {
  const doctors = useLoaderData<typeof loader>();
  return (
    <div className="font-sans p-4">

      <h2 className="text-5xl font-bold">Doctors</h2>

      <ul>
        {doctors.map((doctor) => (
          <li key={doctor.id}>
            <Link to={`/users/${doctor.username}`}>{doctor.username}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
