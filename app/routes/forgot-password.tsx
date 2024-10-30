import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
  type ActionFunctionArgs,
  json,
  type MetaFunction,
  redirect,
} from '@remix-run/node'
import { Form, Link, useActionData, useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { ErrorList, Field } from '~/components/forms'
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
import { prisma } from '~/db.server'
import { prepareVerification } from '~/services/verify.server'
import { useIsPending } from '~/utils/misc'
import { EmailSchema, UsernameSchema } from '~/utils/user-validation'

export const meta: MetaFunction = () => {
  return [{ title: 'Forgot Password / CH' }]
}

const ForgotPasswordSchema = z.object({
  usernameOrEmail: z.union([EmailSchema, UsernameSchema]),
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const submission = await parseWithZod(formData, {
    schema: ForgotPasswordSchema.superRefine(async (data, ctx) => {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.usernameOrEmail },
            { username: data.usernameOrEmail },
          ],
        },
        select: { id: true },
      })
      if (!user) {
        ctx.addIssue({
          path: ['usernameOrEmail'],
          code: z.ZodIssueCode.custom,
          message: 'No user exists with this username or email',
        })
        return
      }
    }),
    async: true,
  })
  if (submission.status !== 'success') {
    return json(
      { result: submission.reply() },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }
  const { usernameOrEmail } = submission.value
  const user = await prisma.user.findFirstOrThrow({
    where: { OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }] },
    select: { email: true, username: true },
  })

  const { verifyUrl, redirectTo, otp } = await prepareVerification({
    period: 10 * 60,
    request,
    type: 'reset-password',
    target: usernameOrEmail,
  })
  const response = await sendEmail({
    to: user.email,
    subject: `Epic Notes Password Reset`,
    react: (
      <ForgotPasswordEmail onboardingUrl={verifyUrl.toString()} otp={otp} />
    ),
  })

  if (response.status === 'success') {
    return redirect(redirectTo.toString())
  } else {
    return json(
      { result: submission.reply({ formErrors: [response.error.message] }) },
      { status: 500 },
    )
  }
}

function ForgotPasswordEmail({
  onboardingUrl,
  otp,
}: {
  onboardingUrl: string
  otp: string
}) {
  return (
    // <E.Html lang="en" dir="ltr">
    // 	<E.Container>
    // 		<h1>
    // 			<E.Text>Epic Notes Password Reset</E.Text>
    // 		</h1>
    // 		<p>
    // 			<E.Text>
    // 				Here's your verification code: <strong>{otp}</strong>
    // 			</E.Text>
    // 		</p>
    // 		<p>
    // 			<E.Text>Or click the link:</E.Text>
    // 		</p>
    // 		<E.Link href={onboardingUrl}>{onboardingUrl}</E.Link>
    // 	</E.Container>
    // </E.Html>
    <></>
  )
}

export default function ForgotPassword() {
  const forgotPassword = useFetcher<typeof action>()
  const [form, fields] = useForm({
    id: 'forgot-password-form',
    constraint: getZodConstraint(ForgotPasswordSchema),
    lastResult: forgotPassword.data?.result,
    onValidate({ formData }) {
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
        <forgotPassword.Form method="POST" {...getFormProps(form)}>
          <CardContent>
            <Field
              labelProps={{
                htmlFor: fields.usernameOrEmail.id,
                children: 'Username or Email',
              }}
              inputProps={{
                autoFocus: true,
                ...getInputProps(fields.usernameOrEmail, { type: 'text' }),
              }}
              errors={fields.usernameOrEmail.errors}
            />
            <ErrorList errors={form.errors} id={form.errorId} />
          </CardContent>
          <CardFooter>
            <div className="flex items-center justify-between gap-6">
              <StatusButton
                className="w-full"
                status={
                  forgotPassword.state === 'submitting'
                    ? 'pending'
                    : (form.status ?? 'idle')
                }
                type="submit"
                disabled={forgotPassword.state !== 'idle'}
              >
                Recover password
              </StatusButton>
            </div>
          </CardFooter>

          <CardFooter>
            <Link
              to="/login"
              className="flex items-center gap-1 text-sm text-cyan-400 hover:underline"
            >
              Back to login
            </Link>
          </CardFooter>
        </forgotPassword.Form>
      </Card>
    </div>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
