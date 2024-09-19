import { Form, MetaFunction } from '@remix-run/react'
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

export const meta: MetaFunction = () => {
  return [{ title: 'Onboarding / CH' }]
}

const fieldVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}
interface FieldProps {
  id: number
  isNew: boolean
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
  isNew: boolean
  onAnimationComplete: () => void
}

interface FieldSectionProps<T extends FieldProps> {
  title: string
  fields: T[]
  addField: () => void
  renderField: (field: T) => React.ReactNode
}

function FieldSection<T extends FieldProps>({
  title,
  fields,
  addField,
  renderField,
}: FieldSectionProps<T>) {
  return (
    <div>
      <motion.div layout>
        <h3 className="mb-2 text-lg font-bold">{title}</h3>
      </motion.div>
      <motion.div layout className="space-y-4">
        <AnimatePresence initial={false}>
          {fields.map(renderField)}
        </AnimatePresence>
      </motion.div>
      <motion.div layout>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="mr-2 h-4 w-4" /> Add {title}
        </Button>
      </motion.div>
    </div>
  )
}

const AnimatedField = ({
  children,
  isNew,
  onAnimationComplete,
}: AnimatedFieldProps) => (
  <motion.div
    variants={fieldVariants}
    initial={isNew ? 'hidden' : 'visible'}
    animate="visible"
    exit="exit"
    transition={{ duration: 0.3 }}
    layout
    onAnimationComplete={onAnimationComplete}
  >
    {children}
  </motion.div>
)

export default function DoctorOnboarding() {
  const [educationFields, setEducationFields] = useState([
    { id: Date.now(), degree: '', institute: '', passedYear: '', isNew: false },
  ])
  const [specialtyFields, setSpecialtyFields] = useState([
    { id: Date.now(), name: '', isNew: false },
  ])

  const addField = <T extends FieldProps>(
    setFields: React.Dispatch<React.SetStateAction<T[]>>,
    newField: Omit<T, 'id' | 'isNew'>,
  ) => {
    setFields(prev => [
      ...prev,
      { ...newField, id: Date.now(), isNew: true } as T,
    ])
  }

  const removeField = <T extends FieldProps>(
    setFields: React.Dispatch<React.SetStateAction<T[]>>,
    id: number,
  ) => {
    setFields(prev => prev.filter(field => field.id !== id))
  }

  const updateField = <T extends FieldProps>(
    setFields: React.Dispatch<React.SetStateAction<T[]>>,
    id: number,
    updates: Partial<T>,
  ) => {
    setFields(prev =>
      prev.map(field => (field.id === id ? { ...field, ...updates } : field)),
    )
  }

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
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                labelProps={{ children: 'Full Name' }}
                inputProps={{ type: 'text', placeholder: 'Dr. John Doe' }}
              />

              <Field
                labelProps={{ children: 'Phone Number' }}
                inputProps={{ type: 'tel', placeholder: '+1234567890' }}
              />
            </div>

            <div>
              <FieldSection<EducationField>
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
                  <AnimatedField
                    key={education.id}
                    isNew={education.isNew}
                    onAnimationComplete={() => {
                      if (education.isNew) {
                        updateField(setEducationFields, education.id, {
                          isNew: true,
                        })
                      }
                    }}
                  >
                    <div className="grid grid-cols-9 items-center gap-4">
                      <Field
                        className="col-span-3"
                        labelProps={{ children: 'Degree' }}
                        inputProps={{
                          type: 'text',
                          value: education.degree,
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            updateField(setEducationFields, education.id, {
                              degree: e.target.value,
                            }),
                        }}
                      />
                      <Field
                        className="col-span-3"
                        labelProps={{ children: 'Institute' }}
                        inputProps={{
                          type: 'text',
                          value: education.institute,
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            updateField(setEducationFields, education.id, {
                              institute: e.target.value,
                            }),
                        }}
                      />
                      <Field
                        className="col-span-2"
                        labelProps={{ children: 'Passed Year' }}
                        inputProps={{
                          type: 'text',
                          value: education.passedYear,
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            updateField(setEducationFields, education.id, {
                              passedYear: e.target.value,
                            }),
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
              />
            </div>

            {/* Specialties Section */}
            <div className="pt-8">
              <FieldSection<SpecialtyField>
                title="Specialties"
                fields={specialtyFields}
                addField={() => addField(setSpecialtyFields, { name: '' })}
                renderField={field => (
                  <AnimatedField
                    key={field.id}
                    isNew={field.isNew}
                    onAnimationComplete={() => {
                      if (field.isNew) {
                        updateField(setSpecialtyFields, field.id, {
                          isNew: true,
                        })
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <Field
                        labelProps={{ children: 'Specialty' }}
                        inputProps={{
                          type: 'text',
                          placeholder: 'Cardiology',
                          value: field.name,
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            updateField(setSpecialtyFields, field.id, {
                              name: e.target.value,
                            }),
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

            <motion.div layout>
              <TextareaField
                labelProps={{ children: 'Bio' }}
                textareaProps={{
                  placeholder:
                    'Tell us about your experience and approach to patient care...',
                }}
              />

              <Button type="submit" className="w-full">
                Submit
              </Button>
            </motion.div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
