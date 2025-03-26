import {
  data,
  Form,
  Link,
  MetaFunction,
  redirect,
  useSearchParams,
} from 'react-router'
import { parseWithZod } from '@conform-to/zod'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { CheckboxField, ErrorList, Field } from '~/components/forms'
import { StatusButton } from '~/components/ui/status-button'
import {
  getSessionExpirationDate,
  login,
  requireAnonymous,
} from '~/services/auth.server'
import { useIsPending } from '~/utils/misc'
import { PasswordSchema, UsernameSchema } from '~/utils/user-validation'
import { authSessionStorage } from '~/services/session.server'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Route } from './+types/login'

const LoginFormSchema = z.object({
  username: UsernameSchema,
  password: PasswordSchema,
  redirectTo: z.string().optional(),
  remember: z.boolean().optional(),
})

export const meta: MetaFunction = () => {
  return [{ title: 'Login / CH' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request)
  return data({})
}

export async function action({ request }: Route.ActionArgs) {
  await requireAnonymous(request)
  const formData = await request.formData()
  // await validateCSRF(formData, request.headers)
  // checkHoneypot(formData)
  const submission = await parseWithZod(formData, {
    schema: () =>
      LoginFormSchema.transform(async (data, ctx) => {
        const user = await login(data)

        if (!user) {
          ctx.addIssue({
            code: 'custom',
            message: 'Invalid password',
          })
          return z.NEVER
        }

        return { ...data, user }
      }),
    async: true,
  })

  if (submission.status !== 'success') {
    return data(submission.reply())
  }

  const { user, remember, redirectTo } = submission.value

  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  cookieSession.set('userId', user.id)

  return redirect(safeRedirect(redirectTo), {
    headers: {
      'set-cookie': await authSessionStorage.commitSession(cookieSession, {
        expires: remember ? getSessionExpirationDate() : undefined,
      }),
    },
  })
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const isPending = useIsPending()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')

  const [form, fields] = useForm({
    id: 'login-form',
    lastResult: actionData,
    defaultValue: { redirectTo },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LoginFormSchema })
    },
    shouldRevalidate: 'onBlur',
  })

  return (
    <div className="flex min-h-full flex-col justify-center pb-32 pt-20">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back!</CardTitle>
          <CardDescription>Please enter your details.</CardDescription>
        </CardHeader>

        <Form method="POST" {...getFormProps(form)}>
          {/* <AuthenticityTokenInput /> */}
          {/* <HoneypotInputs /> */}
          <CardContent>
            <Field
              labelProps={{ children: 'Username' }}
              inputProps={{
                ...getInputProps(fields.username, { type: 'text' }),
                autoFocus: true,
                className: 'lowercase',
              }}
              errors={fields.username.errors}
            />

            <Field
              labelProps={{ children: 'Password' }}
              inputProps={{
                ...getInputProps(fields.password, { type: 'password' }),
              }}
              errors={fields.password.errors}
            />

            <div className="flex justify-between">
              <CheckboxField
                labelProps={{
                  htmlFor: fields.remember.id,
                  children: 'Remember me',
                }}
                // @ts-expect-error @ts-ignore
                buttonProps={{
                  ...getInputProps(fields.remember, {
                    type: 'checkbox',
                  }),
                }}
                errors={fields.remember.errors}
              />
              <div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-cyan-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <input {...getInputProps(fields.redirectTo, { type: 'hidden' })} />
            <ErrorList errors={form.errors} id={form.errorId} />
          </CardContent>
          <CardFooter>
            <StatusButton
              className="w-full"
              status={isPending ? 'pending' : (actionData?.status ?? 'idle')}
              type="submit"
              disabled={isPending}
            >
              Log in
            </StatusButton>
          </CardFooter>
          <CardFooter>
            <p>
              New here?
              <Link to="/signup" className="ml-2 text-cyan-400 hover:underline">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
