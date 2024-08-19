import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from '@remix-run/node'
import { Form, Link, useFetcher, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { PageTitle } from '~/components/typography'
import { Button } from '~/components/ui/button'
import { prisma } from '~/db.server'
import { requireDoctor } from '~/services/auth.server'
import { LocationCombobox } from './resources.location-combobox'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'

export const meta: MetaFunction = () => {
  return [{ title: 'Schedule / CH' }]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const doctor = await requireDoctor(request)
  const serviceLocations = await prisma.scheduleLocation.findMany()
  return json({ doctor, serviceLocations })
}

export async function action({ request }: ActionFunctionArgs) {
  console.log('action')
  const formData = await request.formData()
  console.log('formData', formData.get('locationId'))
  console.log('days', formData.getAll('days'))
  console.log('startTime', formData.get('startTime'))
  console.log('endTime', formData.get('endTime'))
  console.log('maxAppointment', formData.get('maxAppointment'))

  return redirect('/add/schedule')
}

// export async function action({ request }: ActionFunctionArgs) {
//   const formData = await request.formData()
//   const { _action, ...values } = Object.fromEntries(formData)
//   const name = String(values.name)
//   const address = String(values.address)
//   const city = String(values.city)
//   const state = String(values.state)
//   const zip = String(values.zip)
//   const serviceLocationId = String(values.serviceLocationId)
//   const day = String()

//   if (_action === 'create_schedule') {
//     const userId = await requireUserId(request)
//   }

//   if (_action === 'create_location') {
//     const location = await prisma.scheduleLocation.create({
//       data: {
//         name,
//         address,
//         city,
//         state,
//         zip,
//       },
//     })
//     return location
//   }
// }

export default function AddSchedule() {
  const data = useLoaderData<typeof loader>()
  // const actionData = useActionData<typeof action>()
  const days = [
    'saturday',
    'sunday',
    'monday',
    'wednesday',
    'thursday',
    'friday',
  ]
  return (
    <div className="mx-auto max-w-7xl py-10">
      <PageTitle>Add Schedule</PageTitle>

      <Form method="POST" className="mt-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <input type="hidden" name="userId" value={data.doctor.userId} />

          <LocationCombobox />
          <div>
            <div className="space-y-1">
              <label className="text-sm font-bold" htmlFor="days">
                Days
              </label>

              <fieldset>
                <ul className="grid grid-cols-3 gap-x-4 gap-y-2">
                  {days.map(day => (
                    <li key={day} className="items-top flex space-x-2">
                      <Checkbox name="days" id={day} value={day} />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={day}
                          className="text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {day}
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              </fieldset>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <Checkbox
                name="days"
                id="repeat"
                value="repeat"
                className="h-3 w-3"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="repeat"
                  className="text-xs font-bold capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Repeat this schedule for every week
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-8">
            <div className="space-y-1">
              <label className="text-sm font-bold" htmlFor="startTime">
                Start Time
              </label>

              <Input
                type="time"
                name="startTime"
                className="w-max"
                defaultValue="10:00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold" htmlFor="endTime">
                End Time
              </label>
              <div className="relative">
                <Input
                  type="time"
                  name="endTime"
                  className="w-max"
                  defaultValue="17:00"
                />
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-sm font-bold" htmlFor="maxAppointment">
                Maximum Appointments per day
              </label>

              <Input type="number" name="maxAppointment" />
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center">
          <Button type="submit">Create Schedule</Button>
        </div>
      </Form>
      {/* <div className="w-1/3">
        <Button onClick={() => setOpenLocationForm(t => !t)}>
          Register a new location
        </Button>
        {openLocationForm ? (
          <locationFetcher.Form
            method="POST"
            className="flex max-w-xl flex-col gap-10 border p-10"
          >
            <label>
              Location Name
              <input type="text" name="name" />
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

            <Button type="submit" value="create_location" name="_action">
              Add Service Location
            </Button>
          </locationFetcher.Form>
        ) : null}
      </div> */}

      {/* {actionData && <p>{actionData.name} has been added</p>} */}
    </div>
  )
}

export function ErrorBoundary() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center p-20">
      <PageTitle>404</PageTitle>
      <p className="text-center text-4xl font-bold">Content not found</p>
      <Link to="/" className="text-center text-lg underline">
        Go back
      </Link>
    </div>
  )
}
