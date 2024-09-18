import { Form, MetaFunction } from '@remix-run/react'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Field, TextareaField } from '~/components/forms'
import { Button } from '~/components/ui/button'
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

export default function DoctorOnboarding() {
  const [educationFields, setEducationFields] = useState([
    { degree: '', institute: '', passedYear: '' },
  ])
  const [specialtyFields, setSpecialtyFields] = useState([''])

  const appendEducationFields = () => {
    setEducationFields([
      ...educationFields,
      { degree: '', institute: '', passedYear: '' },
    ])
  }

  const appendSpecialtyField = () => {
    setSpecialtyFields([...specialtyFields, ''])
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
              <h3 className="mb-2 text-lg font-bold">Education</h3>
              {educationFields.map((education, index) => (
                <div
                  key={index}
                  className="grid grid-cols-9 items-center gap-4"
                >
                  <Field
                    labelProps={{ children: 'Institute' }}
                    inputProps={{
                      type: 'text',
                      placeholder: 'University Name',
                      value: education.institute,
                    }}
                    className="col-span-4"
                  />
                  <Field
                    labelProps={{ children: 'Degree' }}
                    className="col-span-2"
                    inputProps={{
                      type: 'text',
                      placeholder: 'MD',
                      value: education.degree,
                    }}
                  />
                  <Field
                    labelProps={{ children: 'Passed Year' }}
                    className="col-span-2"
                    inputProps={{
                      type: 'text',
                      placeholder: '2020',
                      value: education.passedYear,
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    className="mb-[10px]"
                    size="icon"
                    onClick={() => {
                      setEducationFields(prev =>
                        prev.filter((_, i) => i !== index),
                      )
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={appendEducationFields}
              >
                <Plus className="mr-2 h-4 w-4" /> Add another education
              </Button>
            </div>

            <div className="pt-8">
              <h3 className="mb-2 text-lg font-bold">Specialties</h3>
              {specialtyFields.map((field, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Field
                    labelProps={{ children: 'Specialty' }}
                    inputProps={{
                      type: 'text',
                      placeholder: 'Cardiology',
                      value: field,
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="mb-[9px]"
                    onClick={() => {
                      setSpecialtyFields(prev =>
                        prev.filter((_, i) => i !== index),
                      )
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={appendSpecialtyField}
              >
                <Plus className="h-4 w-4" /> Add Specialty
              </Button>
            </div>

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
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
