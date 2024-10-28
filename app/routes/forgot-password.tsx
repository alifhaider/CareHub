import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import {
  type ActionFunctionArgs,
  json,
  type MetaFunction,
  redirect,
} from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Field } from '~/components/forms'
import { Spacer } from '~/components/spacer'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { StatusButton } from '~/components/ui/status-button'
import { useIsPending } from '~/utils/misc'
import { EmailSchema } from '~/utils/user-validation'

export const meta: MetaFunction = () => {
  return [{ title: 'Forgot Pass / CH' }]
}

const ForgotPasswordSchema = z.object({
  email: EmailSchema,
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const submission = await parseWithZod(formData, {
    schema: ForgotPasswordSchema,
  })

  if (submission.status !== 'success') {
    return json(submission.reply())
  }

  // send reset email

  return redirect('/login')
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>()
  const isPending = useIsPending()

  const [form, fields] = useForm({
    id: 'forgot-password-form',
    lastResult: actionData,
    onValidate({ formData }) {
      console.log('formData', Object.fromEntries(formData))
      return parseWithZod(formData, { schema: ForgotPasswordSchema })
    },
    shouldRevalidate: 'onBlur',
  })

  return (
    <div className="container mx-auto pb-32 pt-20">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to reset your password
          </CardDescription>
        </CardHeader>
        <Form method="POST" {...getFormProps(form)}>
          <CardContent>
            <Field
              labelProps={{ htmlFor: fields.email.id, children: 'Email' }}
              inputProps={{
                ...getInputProps(fields.email, { type: 'email' }),
                autoComplete: 'email',
                autoFocus: true,
                className: 'lowercase',
              }}
              errors={fields.email.errors}
            />
          </CardContent>
          <CardFooter>
            <div className="flex items-center justify-between gap-6">
              <StatusButton
                className="w-full"
                status={isPending ? 'pending' : (actionData?.status ?? 'idle')}
                type="submit"
                disabled={isPending}
              >
                Send Reset Email
              </StatusButton>
            </div>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
