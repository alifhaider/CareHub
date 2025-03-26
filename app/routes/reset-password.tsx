import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form, data, type MetaFunction, redirect } from 'react-router'
import { redirectWithSuccess } from 'remix-toast'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { ErrorList, Field } from '~/components/forms'
import bcrypt from 'bcryptjs'
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
import { PasswordAndConfirmPasswordSchema } from '~/utils/user-validation'
import { requireAnonymous, resetUserPassword } from '~/services/auth.server'
import { verifySessionStorage } from '~/utils/verification.server'
import { Route } from './+types/reset-password'

export const meta: MetaFunction = () => {
  return [{ title: 'Reset Password / CH' }]
}

export const resetPasswordUsernameSessionKey = 'resetPasswordUsername'

const ResetPasswordSchema = PasswordAndConfirmPasswordSchema

async function requireResetPasswordUsername(request: Request) {
  await requireAnonymous(request)
  const verifySession = await verifySessionStorage.getSession(
    request.headers.get('cookie'),
  )
  const resetPasswordUsername = verifySession.get(
    resetPasswordUsernameSessionKey,
  )
  if (typeof resetPasswordUsername !== 'string' || !resetPasswordUsername) {
    throw redirect('/login')
  }
  return resetPasswordUsername
}

export async function loader({ request }: Route.LoaderArgs) {
  const resetPasswordUsername = await requireResetPasswordUsername(request)
  return data({ resetPasswordUsername })
}

export async function action({ request }: Route.ActionArgs) {
  const resetPasswordUsername = await requireResetPasswordUsername(request)
  const formData = await request.formData()
  const submission = parseWithZod(formData, {
    schema: ResetPasswordSchema,
  })

  if (submission.status !== 'success') {
    return data(
      { result: submission.reply() },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }

  const { password } = submission.value
  await resetUserPassword({ username: resetPasswordUsername, password })
  const verifySession = await verifySessionStorage.getSession()
  return redirect('/login', {
    headers: {
      'set-cookie': await verifySessionStorage.destroySession(verifySession),
    },
  })
}

export default function ForgotPassword({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const isPending = useIsPending()

  const [form, fields] = useForm({
    id: 'reset-password',
    constraint: getZodConstraint(ResetPasswordSchema),
    onValidate({ formData }) {
      console.log('formData', Object.fromEntries(formData))
      return parseWithZod(formData, { schema: ResetPasswordSchema })
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
              labelProps={{
                htmlFor: fields.password.id,
                children: 'New Password',
              }}
              inputProps={{
                ...getInputProps(fields.password, { type: 'password' }),
                autoComplete: 'new-password',
                autoFocus: true,
              }}
              errors={fields.password.errors}
            />

            <Field
              labelProps={{
                htmlFor: fields.confirmPassword.id,
                children: 'Confirm Password',
              }}
              inputProps={{
                ...getInputProps(fields.confirmPassword, { type: 'password' }),
                autoComplete: 'new-password',
              }}
              errors={fields.confirmPassword.errors}
            />

            <ErrorList errors={form.errors} id={form.errorId} />
          </CardContent>
          <CardFooter>
            <div className="flex items-center justify-between gap-6">
              <StatusButton
                className="w-full"
                status={isPending ? 'pending' : (form.status ?? 'idle')}
                type="submit"
                disabled={isPending}
              >
                Reset password
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
