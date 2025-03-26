import { Plus, Trash2 } from 'lucide-react'
import { ErrorList, Field, TextareaField } from '~/components/forms'
import { Button, buttonVariants } from '~/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { z } from 'zod'
import { data, redirect, Form, MetaFunction } from 'react-router'
import { parseWithZod } from '@conform-to/zod'
import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { cn } from '~/lib/utils'
import { prisma } from '~/db.server'
import { requireUser } from '~/services/auth.server'
import { redirectWithSuccess } from 'remix-toast'
import { Spacer } from '~/components/spacer'
import { Route } from './+types/doctor.onboarding'

export const meta: MetaFunction = () => {
  return [{ title: 'Onboarding / CH' }]
}

const EducationSchema = z.object({
  degree: z.string({ message: 'Add degree' }),
  institute: z.string({ message: 'Add institute' }),
  passedYear: z.string({ message: 'Add passed year' }),
})

const SpecialtySchema = z.object({
  name: z.string({ message: 'Add specialty' }),
})

export const OnboardingSchema = z.object({
  userId: z.string({ message: 'User ID is required' }),
  fullName: z.string().optional(),
  educations: z
    .array(EducationSchema)
    .nonempty({ message: 'Add at least one education (ex: MBBS, MD)' }),
  specialties: z.array(SpecialtySchema).nonempty({
    message: 'Add at least one specialty (ex: Cardiology, Dermatology)',
  }),
  bio: z.string().optional(),
  profilePicture: z.string().optional(),
})

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request)
  const isAlreadyOnboarded = await prisma.doctor.findUnique({
    where: {
      userId: user.id,
    },
  })

  if (isAlreadyOnboarded) {
    return redirect(`/profile/${user.username}`)
  }

  return data({ user })
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request)
  const formData = await request.formData()
  const submission = parseWithZod(formData, {
    schema: OnboardingSchema,
  })

  if (submission.status !== 'success') {
    return data(submission.reply({ formErrors: ['Could not onboard doctor'] }))
  }

  await prisma.doctor.create({
    data: {
      bio: submission.value.bio ?? '',
      education: {
        create: submission.value.educations.map(education => ({
          degree: education.degree,
          institute: education.institute,
          year: education.passedYear,
        })),
      },
      specialties: {
        create: submission.value.specialties.map(specialty => ({
          name: specialty.name,
        })),
      },
      user: {
        connect: {
          id: submission.value.userId,
        },
      },
    },
  })

  return redirectWithSuccess(`/profile/${user.username}`, {
    message: 'Congratulations! You have successfully became a CareHub doctor.',
    description: 'You can now start adding your schedule.',
  })
}

export default function DoctorOnboarding({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { user } = loaderData

  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: OnboardingSchema })
    },
    shouldRevalidate: 'onSubmit',
    defaultValue: {
      educations: [{ degree: '', institute: '', passedYear: '' }],
      specialties: [{ name: '' }],
    },
  })

  const educations = fields.educations.getFieldList()
  const specialties = fields.specialties.getFieldList()

  return (
    <div className="min-h-screen bg-background">
      <Spacer variant="lg" />
      <Card className="mx-auto max-w-2xl border-none shadow-none">
        <CardHeader className="pt-0">
          <CardTitle className="text-3xl font-bold">
            Doctor Onboarding
          </CardTitle>
          <CardDescription>
            Please provide your information to get started with CareHub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="POST" className="space-y-8" {...getFormProps(form)}>
            <div className="grid grid-cols-2 gap-4">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="username" value={user.username} />

              <Field
                labelProps={{ children: 'Full Name' }}
                inputProps={{
                  placeholder: 'Dr. Md. Shahriar Hossain',
                  ...getInputProps(fields.fullName, { type: 'text' }),
                  defaultValue: user.fullName ?? '',
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
                              placeholder: 'Dhaka Medical College',
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
                              placeholder: 'MBBS',
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
                              placeholder: '2010',
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
                              placeholder: 'Cardiology',
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
                placeholder:
                  'Tell us about your experience and approach to patient care...',
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
      <Spacer variant="lg" />
    </div>
  )
}

export const AnimateHeight = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        opacity: { duration: 0.2 },
        height: { duration: 0.3 },
      }}
    >
      {children}
    </motion.div>
  )
}
