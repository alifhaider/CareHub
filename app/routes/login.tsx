import {
  json,
  LoaderFunctionArgs,
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
} from '@remix-run/node'
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react'
import { z } from 'zod'
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

const LoginFormSchema = z.object({
  username: UsernameSchema,
  password: PasswordSchema,
  redirectTo: z.string().optional(),
  remember: z.boolean().optional(),
})

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAnonymous(request)
  return json({})
}

export async function action({ request }: ActionFunctionArgs) {
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
    return json(submission.reply())
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

export default function LoginPage() {
  const actionData = useActionData<typeof action>()
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
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-h1">Welcome back!</h1>
          <p className="text-body-md text-muted-foreground">
            Please enter your details.
          </p>
        </div>

        <div className="mt-10" />

        <div>
          <div className="mx-auto w-full max-w-md px-8">
            <Form method="POST" {...getFormProps(form)}>
              {/* <AuthenticityTokenInput /> */}
              {/* <HoneypotInputs /> */}
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
                    className="text-body-xs font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <input
                {...getInputProps(fields.redirectTo, { type: 'hidden' })}
              />
              <ErrorList errors={form.errors} id={form.errorId} />

              <div className="flex items-center justify-between gap-6 pt-3">
                <StatusButton
                  className="w-full"
                  status={
                    isPending ? 'pending' : (actionData?.status ?? 'idle')
                  }
                  type="submit"
                  disabled={isPending}
                >
                  Log in
                </StatusButton>
              </div>
            </Form>
            <div className="flex items-center justify-center gap-2 pt-6">
              <span className="text-muted-foreground">New here?</span>
              <Link to="/signup">Create an account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: 'Login / CH' }]
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
