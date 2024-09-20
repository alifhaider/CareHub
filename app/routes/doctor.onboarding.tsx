import { Form, MetaFunction, useActionData } from '@remix-run/react'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Field, TextareaField } from '~/components/forms'
import { Button } from '~/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { z } from 'zod'
import { ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'

interface FieldProps {
  id: number
}

interface EducationField extends FieldProps {
  degree: string
  institute: string
  passedYear: string
}

interface SpecialtyField extends FieldProps {
  name: string
}

type AnimatedFieldProps = {
  children: React.ReactNode
}

interface FieldSectionProps<T extends FieldProps> {
  title: string
  fields: T[]
  addField: () => void
  renderField: (field: T) => React.ReactNode
}

export const meta: MetaFunction = () => {
  return [{ title: 'Onboarding / CH' }]
}

const OnboardingSchema = z.object({
  fullName: z.string(),
  phoneNumber: z.string(),
  education: z.array(
    z.object({
      degree: z.string(),
      institute: z.string(),
      passedYear: z.string(),
    }),
  ),
  specialties: z.array(z.object({ name: z.string() })),
  bio: z.string(),
  profilePicture: z.string(),
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  const submission = await parseWithZod(formData, {
    schema: () =>
      OnboardingSchema.transform(async (data, ctx) => {
        const doctor = { id: 1 } // perform doctor onboarding here

        if (!doctor) {
          ctx.addIssue({
            code: 'custom',
            message: 'Could not create doctor',
          })
          return z.NEVER
        }

        return { ...data, doctor }
      }),
    async: true,
  })

  if (submission.status !== 'success') {
    return json(submission.reply({ formErrors: ['Could not onboard doctor'] }))
  }

  return redirect('/')
}

function FieldSection<T extends FieldProps>({
  title,
  fields,
  addField,
  renderField,
}: FieldSectionProps<T>) {
  return (
    <div>
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <AnimatePresence initial={false}>
        {fields.map(renderField)}
      </AnimatePresence>
      <Button type="button" variant="outline" size="sm" onClick={addField}>
        <Plus className="mr-2 h-4 w-4" /> Add {title}
      </Button>
    </div>
  )
}

const AnimatedField = ({ children }: AnimatedFieldProps) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ opacity: { duration: 0.2 }, height: { duration: 0.3 } }}
  >
    {children}
  </motion.div>
)

export default function DoctorOnboarding() {
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: OnboardingSchema })
    },
    shouldRevalidate: 'onSubmit',
  })

  const [educationFields, setEducationFields] = useState([
    { id: Date.now(), degree: '', institute: '', passedYear: '' },
  ])
  const [specialtyFields, setSpecialtyFields] = useState([
    { id: Date.now(), name: '' },
  ])

  const addField = <T extends FieldProps>(
    setFields: React.Dispatch<React.SetStateAction<T[]>>,
    newField: Omit<T, 'id' | 'isNew'>,
  ) => {
    setFields(prev => [...prev, { ...newField, id: Date.now() } as T])
  }

  const removeField = <T extends FieldProps>(
    setFields: React.Dispatch<React.SetStateAction<T[]>>,
    id: number,
  ) => {
    setFields(prev => prev.filter(field => field.id !== id))
  }

  const educations = fields.education.getFieldList()
  console.log({educations})

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="mx-auto max-w-2xl border-none shadow-none">
        <CardHeader>
          <CardTitle>Doctor Onboarding</CardTitle>
          <CardDescription>
            Please provide your information to get started with CareHub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="POST" className="space-y-4" {...getFormProps(form)}>
            <div className="grid grid-cols-2 gap-4">
              <Field
                labelProps={{ children: 'Full Name' }}
                inputProps={{
                  placeholder: 'Dr. John Doe',
                  ...getInputProps(fields.fullName, { type: 'text' }),
                }}
              />

              <Field
                labelProps={{ children: 'Phone Number' }}
                inputProps={{
                  placeholder: '+1234567890',
                  ...getInputProps(fields.phoneNumber, { type: 'tel' }),
                }}
              />
            </div>

            <div>
              <h3 className="mb-2 text-lg font-bold">Education</h3>
              <AnimatePresence initial={false}>
                {educations.map((education, index) => {
                  const educationFields = education.getFieldset()
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        opacity: { duration: 0.2 },
                        height: { duration: 0.3 },
                      }}
                    >
                      <div className="grid grid-cols-9 items-center gap-4">
                        <Field
                          className="col-span-4"
                          labelProps={{ children: 'Institute' }}
                          inputProps={{
                            placeholder:
                              'University of California, San Francisco',
                            ...getInputProps(educationFields.institute, {
                              type: 'text',
                            }),
                          }}
                        />
                        <Field
                          className="col-span-2"
                          labelProps={{ children: 'Degree' }}
                          inputProps={{
                            placeholder: 'MD',
                            ...getInputProps(educationFields.degree, {
                              type: 'text',
                            }),
                          }}
                        />
                        <Field
                          className="col-span-2"
                          labelProps={{ children: 'Passed Year' }}
                          inputProps={{
                            placeholder: '2024',
                            ...getInputProps(educationFields.passedYear, {
                              type: 'text',
                            }),
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          className="mb-[10px]"
                          size="icon"
                          // onClick={() =>
                          //   removeField(setEducationFields, education.id)
                          // }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              <Button
                type="button"
                variant="outline"
                size="sm"
                // onClick={() =>
                //   addField(educations.addField, {
                //     degree: '',
                //     institute: '',
                //     passedYear: '',
                //   })
                // }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Education
              </Button>

              {/* <FieldSection<EducationField>
                title="Education"
                fields={educationFields}
                addField={() =>
                  addField(setEducationFields, {
                    degree: '',
                    institute: '',
                    passedYear: '',
                  })
                }
                renderField={education => (
                  <AnimatedField key={education.id}>
                    <div className="grid grid-cols-9 items-center gap-4">
                      <Field
                        className="col-span-4"
                        labelProps={{ children: 'Institute' }}
                        inputProps={{

                          placeholder:
                            'University of California, San Francisco',
                          ...getInputProps(fields.education., { type: 'text' }),
                        }}
                      />
                      <Field
                        className="col-span-2"
                        labelProps={{ children: 'Degree' }}
                        inputProps={{
                          type: 'text',
                          placeholder: 'MD',
                        }}
                      />
                      <Field
                        className="col-span-2"
                        labelProps={{ children: 'Passed Year' }}
                        inputProps={{
                          type: 'text',
                          placeholder: '2024',
                          value: education.passedYear,
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        className="mb-[10px]"
                        size="icon"
                        onClick={() =>
                          removeField(setEducationFields, education.id)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </AnimatedField>
                )}
              /> */}
            </div>

            {/* Specialties Section */}
            <div className="pt-8">
              <FieldSection<SpecialtyField>
                title="Specialties"
                fields={specialtyFields}
                addField={() => addField(setSpecialtyFields, { name: '' })}
                renderField={field => (
                  <AnimatedField key={field.id}>
                    <div className="flex items-center gap-4">
                      <Field
                        labelProps={{ children: 'Specialty' }}
                        inputProps={{
                          type: 'text',
                          placeholder: 'Cardiology',
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="mb-[9px]"
                        onClick={() =>
                          removeField(setSpecialtyFields, field.id)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </AnimatedField>
                )}
              />
            </div>

            <TextareaField
              labelProps={{ children: 'Bio' }}
              textareaProps={{
                placeholder:
                  'Tell us about your experience and approach to patient care...',
              }}
            />

            <Field
              labelProps={{ children: 'Profile Picture' }}
              inputProps={{ type: 'file' }}
              className="mb-4 max-w-xs"
            />

            <Button type="submit" className="w-full">
              Submit
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
