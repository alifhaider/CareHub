import { parseWithZod } from '@conform-to/zod'
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { prisma } from '~/db.server'
import { requireDoctor } from '~/services/auth.server'
import { AnimateHeight, OnboardingSchema } from './doctor.onboarding'
import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { redirectWithSuccess } from 'remix-toast'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ErrorList, Field, TextareaField } from '~/components/forms'
import { AnimatePresence } from 'framer-motion'
import { cn } from '~/lib/utils'
import { Button, buttonVariants } from '~/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { Spacer } from '~/components/spacer'

export const meta: MetaFunction = () => {
  return [{ title: 'Edit Profile / CH' }]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireDoctor(request)
  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: user.userId,
    },
    include: {
      user: {
        select: {
          username: true,
          fullName: true,
        },
      },
      specialties: true,
      education: true,
    },
  })
  return { doctor }
}

export async function action({ request }: ActionFunctionArgs) {
  const doctor = await requireDoctor(request)
  const formData = await request.formData()
  const submission = parseWithZod(formData, {
    schema: OnboardingSchema,
  })

  if (submission.status !== 'success') {
    return json(
      submission.reply({ formErrors: ['Could not edit doctor profile'] }),
    )
  }

  await prisma.$transaction(async tx => {
    // Update user's basic info
    await tx.user.update({
      where: { id: doctor.userId },
      data: {
        fullName: submission.value.fullName,
      },
    })
    // Update doctor's basic info
    await tx.doctor.update({
      where: { userId: doctor.userId },
      data: {
        bio: submission.value.bio,
        specialties: {
          deleteMany: {},
          create: submission.value.specialties.map(specialty => ({
            name: specialty.name,
          })),
        },
        education: {
          deleteMany: {},
          create: submission.value.educations.map(education => ({
            degree: education.degree,
            institute: education.institute,
            year: education.passedYear,
          })),
        },
      },
    })
  })
  return redirectWithSuccess(`/profile/${doctor.user.username}`, {
    message: 'Your profile has been updated!',
  })
}

export default function ProfileEdit() {
  const lastResult = useActionData<typeof action>()
  const { doctor } = useLoaderData<typeof loader>()

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: OnboardingSchema })
    },
    defaultValue: {
      educations: doctor?.education.map(education => ({
        degree: education.degree,
        institute: education.institute,
        passedYear: education.year,
      })),
      specialties: doctor?.specialties.map(specialty => ({
        name: specialty.name,
      })),
    },
    shouldRevalidate: 'onSubmit',
  })

  const educations = fields.educations.getFieldList()
  const specialties = fields.specialties.getFieldList()
  return (
    <>
      <Spacer variant="lg" />
      <div className="container">
        <Card className="mx-auto max-w-2xl border-none shadow-none">
          <CardHeader className="pt-0">
            <CardTitle className="text-3xl font-bold">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="POST" className="space-y-8" {...getFormProps(form)}>
              <div className="grid grid-cols-2 gap-4">
                <input type="hidden" name="userId" value={doctor?.userId} />
                <input
                  type="hidden"
                  name="username"
                  value={doctor?.user.username}
                />
                <Field
                  labelProps={{ children: 'Full Name' }}
                  inputProps={{
                    placeholder: 'John Doe',
                    defaultValue: doctor?.user.fullName ?? '',
                    ...getInputProps(fields.fullName, { type: 'text' }),
                  }}
                  errors={fields.fullName.errors}
                />
              </div>

              <div>
                <h3 className="mb-2 text-lg font-bold">Education</h3>
                <AnimatePresence initial={false}>
                  {educations.map((education, index) => {
                    const educationFields = education.getFieldset()
                    return (
                      <AnimateHeight key={education.key}>
                        <fieldset {...getFieldsetProps(education)}>
                          <div className="grid grid-cols-9 items-center gap-4">
                            <Field
                              className="col-span-4"
                              labelProps={{ children: 'Institute' }}
                              inputProps={{
                                ...getInputProps(educationFields.institute, {
                                  type: 'text',
                                }),
                              }}
                              errors={educationFields.institute.errors}
                            />
                            <Field
                              className="col-span-2"
                              labelProps={{ children: 'Degree' }}
                              inputProps={{
                                ...getInputProps(educationFields.degree, {
                                  type: 'text',
                                }),
                              }}
                              errors={educationFields.degree.errors}
                            />
                            <Field
                              className="col-span-2"
                              labelProps={{ children: 'Passed Year' }}
                              inputProps={{
                                ...getInputProps(educationFields.passedYear, {
                                  type: 'text',
                                }),
                              }}
                              errors={educationFields.passedYear.errors}
                            />
                            <button
                              className={cn(
                                buttonVariants({
                                  variant: 'destructive',
                                  size: 'icon',
                                }),
                                'mb-[10px]',
                              )}
                              {...form.remove.getButtonProps({
                                name: fields.educations.name,
                                index,
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </fieldset>
                      </AnimateHeight>
                    )
                  })}
                </AnimatePresence>

                <ErrorList errors={fields.educations.errors} />

                <button
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                  )}
                  {...form.insert.getButtonProps({
                    name: fields.educations.name,
                  })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Education
                </button>
              </div>

              <div className="py-8">
                <h3 className="mb-2 text-lg font-bold">Specialties</h3>
                <AnimatePresence initial={false}>
                  {specialties.map((specialty, index) => {
                    const specialtyFields = specialty.getFieldset()
                    return (
                      <AnimateHeight key={specialty.key}>
                        <fieldset {...getFieldsetProps(specialty)}>
                          <div className="grid grid-cols-9 items-center gap-4">
                            <Field
                              className="col-span-4"
                              labelProps={{ children: 'Name' }}
                              inputProps={{
                                ...getInputProps(specialtyFields.name, {
                                  type: 'text',
                                }),
                              }}
                              errors={specialtyFields.name.errors}
                            />
                            <button
                              {...form.remove.getButtonProps({
                                name: fields.specialties.name,
                                index,
                              })}
                              className={cn(
                                buttonVariants({
                                  variant: 'destructive',
                                  size: 'icon',
                                }),
                                'mb-[10px]',
                              )}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </fieldset>
                      </AnimateHeight>
                    )
                  })}
                </AnimatePresence>
                <ErrorList errors={fields.specialties.errors} />

                <button
                  {...form.insert.getButtonProps({
                    name: fields.specialties.name,
                  })}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                  )}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add specialty
                </button>
              </div>

              <TextareaField
                labelProps={{ children: 'Bio' }}
                textareaProps={{
                  defaultValue: doctor?.bio ?? '',
                  ...getInputProps(fields.bio, { type: 'text' }),
                }}
                errors={fields.bio.errors}
              />

              <Field
                labelProps={{ children: 'Profile Picture' }}
                inputProps={{ type: 'file' }}
                className="mb-4 max-w-xs"
                errors={fields.profilePicture.errors}
              />

              <Button type="submit" className="w-full">
                Submit
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Spacer variant="lg" />
    </>
  )
}
