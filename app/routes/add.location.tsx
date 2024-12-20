import { getFormProps, getInputProps, Intent, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { redirectWithSuccess } from 'remix-toast'
import { z } from 'zod'
import { ErrorList, Field } from '~/components/forms'
import { Spacer } from '~/components/spacer'
import { PageTitle } from '~/components/typography'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
import { Button } from '~/components/ui/button'
import { prisma } from '~/db.server'
import { requireDoctor } from '~/services/auth.server'

function CreateLocationSchema(
  intent: Intent | null,
  options?: {
    isLocationUnique: (
      name: string,
      address: string,
      city: string,
      state?: string,
      zip?: string,
    ) => Promise<boolean>
  },
) {
  return z
    .object({
      name: z.string({ message: 'Please provide the name of your location.' }),
      address: z.string({
        message: 'Please provide the address of your location.',
      }),
      city: z.string({ message: 'Please specify the city of your location.' }),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .pipe(
      z
        .object({
          name: z.string(),
          address: z.string(),
          city: z.string(),
          state: z.string().optional(),
          zip: z.string().optional(),
        })
        .superRefine(async (data, ctx) => {
          const isValidatingLocation =
            intent === null ||
            (intent.type === 'validate' &&
              intent.payload.name === 'name' &&
              intent.payload.name === 'address' &&
              intent.payload.name === 'city')
          if (!isValidatingLocation) {
            ctx.addIssue({
              code: 'custom',
              path: ['form'],
              message:
                'The location validation process is not properly initiated.',
            })
            return
          }

          if (typeof options?.isLocationUnique !== 'function') {
            ctx.addIssue({
              code: 'custom',
              path: ['form'],
              message:
                'Location uniqueness validation function is not provided.',
              fatal: true,
            })
            return
          }

          try {
            const isUnique = await options.isLocationUnique(
              data.name.toLowerCase(),
              data.address.toLowerCase(),
              data.city.toLowerCase(),
              data.state?.toLowerCase(),
              data.zip?.toLowerCase(),
            )

            if (!isUnique) {
              ctx.addIssue({
                code: 'custom',
                path: ['form'],
                message:
                  'A location with the same details already exists. Please provide unique details.',
              })
            }
          } catch (error) {
            ctx.addIssue({
              code: 'custom',
              path: ['form'],
              message:
                'An error occurred during location validation. Please try again later.',
              fatal: true,
            })
          }
        }),
    )
}

export async function loader({ request }: LoaderFunctionArgs) {
  const doctor = await requireDoctor(request)
  return json({ doctor })
}

export async function action({ request }: ActionFunctionArgs) {
  await requireDoctor(request)
  const formData = await request.formData()

  const submission = await parseWithZod(formData, {
    schema: intent =>
      CreateLocationSchema(intent, {
        async isLocationUnique(name, address, city) {
          const location = await prisma.scheduleLocation.findFirst({
            where: {
              name,
              address,
              city,
            },
          })
          return !location
        },
      }),
    async: true,
  })

  if (submission.status !== 'success') {
    const customError = submission.error?.form
    return json(
      submission.reply({
        formErrors: customError ?? ['There was an error creating the location'],
      }),
    )
  }

  const { address, name, city, state, zip } = submission.value
  await prisma.scheduleLocation.create({
    data: {
      address,
      name,
      city,
      state,
      zip,
    },
  })
  return redirectWithSuccess('/add/schedule', {
    message: 'Location created successfully',
  })
}

export default function AddLocation() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: intent => CreateLocationSchema(intent),
      })
    },
    shouldRevalidate: 'onSubmit',
  })
  return (
    <>
      <Spacer variant="lg" />
      <div className="mx-auto max-w-7xl py-10">
        <PageTitle>Add Location</PageTitle>
        <HelpText />
        <Form method="post" className="mt-10" {...getFormProps(form)}>
          <div className="grid grid-cols-1 gap-4 align-top md:grid-cols-2">
            <input type="hidden" name="userId" value={data.doctor.userId} />
            <Field
              labelProps={{ children: 'Location Name', className: 'mb-1' }}
              inputProps={{
                placeholder: 'Square Hospital',
                ...getInputProps(fields.name, { type: 'text' }),
              }}
              errors={fields.name.errors}
            />
            <Field
              labelProps={{ children: 'Address', className: 'mb-1' }}
              inputProps={{
                placeholder: '18/F West Panthapath',
                ...getInputProps(fields.address, { type: 'text' }),
              }}
              errors={fields.address.errors}
            />
            <Field
              labelProps={{ children: 'City', className: 'mb-1' }}
              inputProps={{
                placeholder: 'Dhaka',
                ...getInputProps(fields.city, { type: 'text' }),
              }}
              errors={fields.city.errors}
            />
            <Field
              labelProps={{ children: 'State', className: 'mb-1' }}
              inputProps={{
                placeholder: 'Dhaka',
                ...getInputProps(fields.state, { type: 'text' }),
              }}
              errors={fields.state.errors}
            />
            <Field
              labelProps={{ children: 'Zip Code', className: 'mb-1' }}
              inputProps={{
                placeholder: '1205',
                ...getInputProps(fields.zip, { type: 'text' }),
              }}
              errors={fields.zip.errors}
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-4">
              <ErrorList size="lg" errors={form.errors} />
            </div>
            <Button type="submit">Create Location</Button>
          </div>
        </Form>
      </div>
      <Spacer variant="lg" />
    </>
  )
}

function HelpText() {
  return (
    <div className="mt-6 max-w-5xl space-y-1 text-sm text-secondary-foreground">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-lg">
            How registering location works?
          </AccordionTrigger>
          <AccordionContent className="space-y-2">
            <p>
              You need to provide the name of the chamber or hospital, address,
              city, state, and zip code. And then by submitting the form, the
              location will be registered to our database.
            </p>
            <p>
              That&apos;s why short location address isn&apos;t allowed. You
              need to provide the full address of the location. Cause we check
              the uniqueness of the location by the full address.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
