import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import { PageTitle } from "~/components/typography";
import { prisma } from "~/db.server";
import { requireDoctor, requireUserId } from "~/services/auth.server";

export async function loader({request}: LoaderFunctionArgs) {
  const doctor = await requireDoctor(request);
  if (!doctor) {
    redirect("/")
  }
  const serviceLocations = await prisma.scheduleLocation.findMany();
  return json({ doctor, serviceLocations });
}


export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { _action, ...values } = Object.fromEntries(formData);
  const name = String(values.name);
  const address = String(values.address);
  const city = String(values.city);
  const state = String(values.state);
  const zip = String(values.zip);


  // if (_action === "create_schedule") {
  //   const userId = await requireUserId(request);
  //   await prisma.schedule.create({
  //     data: {
  //       ...values,
  //       doctor: {
  //         connect: {
  //           userId,
  //         },
  //       },
  //     },
  //   });
  // }

  if (_action === "create_location") {
    const location = await prisma.scheduleLocation.create({
      data: {
        name,
        address,
        city,
        state,
        zip
      }
    });
    return location
  }

}


export default function AddSchedule() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const locationFetcher = useFetcher();
  return (
    <div>
      <PageTitle>Add Schedule</PageTitle>

      <div className="flex">

       <Form
        method="POST"
        className="flex flex-1 flex-col gap-10 border p-10"
      >
        <input type="hidden" name="userId" value={data.doctor.userId} />

        
        <label>
            Hospital Name
            <select name="serviceLocationId" required>
            {data.serviceLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          </label>
          


        <label>
          Date
          <input type="date" name="date" required />
        </label>

        <label>
          Time
          <input type="time" name="time" required />
        </label>

        <button type="submit" name="_action" value="create_schedule">Add Schedule</button>
        </Form>
        <locationFetcher.Form
        method="POST"
        className="flex flex-col gap-10 max-w-xl border p-10"
      > 
        <label>
          Location Name
          <input type="text" name="name" required />
        </label>

        <label>
          Address
          <input type="text" name="address" required />
        </label>

        <label>
          City
          <input type="text" name="city" required />
        </label>
        <label>
          State
          <input type="state" name="state" />
        </label>
        <label>
          Zip
          <input type="text" name="zip" />
        </label>

        <button type="submit" value="create_location" name="_action">Add Service Location</button>
      </locationFetcher.Form>
      </div>

      {actionData && (
        <p>{actionData.name} has been added</p>
      )}
    </div>
  )
}