import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { data, redirect, type MetaFunction, Form, Link } from 'react-router'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '~/db.server'
import {
  ConfirmPasswordSchema,
  EmailSchema,
  PasswordSchema,
  UsernameSchema,
} from '~/utils/user-validation'
import { getSessionExpirationDate } from '~/services/auth.server'
import { useIsPending } from '~/utils/misc'
import { CheckboxField, ErrorList, Field } from '~/components/forms'
import { StatusButton } from '~/components/ui/status-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { authSessionStorage } from '~/services/session.server'
import { Route } from './+types/signup'

const SignupFormSchema = z
  .object({
    username: UsernameSchema,
    email: EmailSchema,
    fullname: z.string().optional(),
    password: PasswordSchema,
    confirmPassword: ConfirmPasswordSchema,
    agreeToTermsOfServiceAndPrivacyPolicy: z
      .string({ required_error: 'You must agree to the terms of service' })
      .refine(value => value === 'true', {
        message: 'You must agree to the terms of service and privacy policy',
      }),
    remember: z.string().optional(),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: 'custom',
        message: 'Passwords do not match',
      })
    }
  })

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  // await validateCSRF(formData, request.headers)
  // checkHoneypot(formData)
  const submission = await parseWithZod(formData, {
    schema: SignupFormSchema.superRefine(async (data, ctx) => {
      const existingEmail = await prisma.user.findFirst({
        where: { email: data.email.toLowerCase() },
        select: { id: true },
      })

      if (existingEmail) {
        ctx.addIssue({
          path: ['email'],
          code: z.ZodIssueCode.custom,
          message: 'A user already exists with this email',
        })
        return
      }

      const existingUsername = await prisma.user.findFirst({
        where: { username: data.username.toLowerCase() },
        select: { id: true },
      })

      if (existingUsername) {
        ctx.addIssue({
          path: ['username'],
          code: z.ZodIssueCode.custom,
          message: 'A user already exists with this username ',
        })
        return
      }
    }).transform(async data => {
      const { username, email, password } = data

      const user = await prisma.user.create({
        select: { id: true },
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          password: {
            create: {
              hash: await bcrypt.hash(password, 10),
            },
          },
        },
      })

      return { ...data, user }
    }),
    async: true,
  })

  if (submission.status !== 'success') {
    return data(submission.reply())
  }

  const { user, remember } = submission.value

  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  cookieSession.set('userId', user.id)

  return redirect('/', {
    headers: {
      'set-cookie': await authSessionStorage.commitSession(cookieSession, {
        expires: remember === 'true' ? getSessionExpirationDate() : undefined,
      }),
    },
  })
}

export const meta: MetaFunction = () => {
  return [{ title: 'Signup / CH' }]
}

export default function SignupRoute({ actionData }: Route.ComponentProps) {
  const isPending = useIsPending()

  const [form, fields] = useForm({
    id: 'signup-form',
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SignupFormSchema })
    },
    shouldRevalidate: 'onBlur',
  })

  return (
    <div className="flex min-h-full flex-col justify-center pb-32 pt-20">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Abroad!</CardTitle>
          <CardDescription>Please enter your details.</CardDescription>
        </CardHeader>
        <Form method="POST" {...getFormProps(form)}>
          <CardContent>
            {/* <AuthenticityTokenInput /> */}
            {/* <HoneypotInputs /> */}
            <Field
              labelProps={{ htmlFor: fields.email.id, children: 'Email' }}
              inputProps={{
                ...getInputProps(fields.email, { type: 'email' }),
                autoComplete: 'email',
                autoFocus: true,
                className: 'lowercase placeholder:capitalize',
              }}
              errors={fields.email.errors}
            />
            <Field
              labelProps={{ htmlFor: fields.username.id, children: 'Username' }}
              inputProps={{
                ...getInputProps(fields.username, { type: 'text' }),
                autoComplete: 'username',
                className: 'lowercase placeholder:capitalize',
              }}
              errors={fields.username.errors}
            />

            <Field
              labelProps={{
                htmlFor: fields.fullname.id,
                children: 'Full Name',
              }}
              inputProps={{
                ...getInputProps(fields.fullname, { type: 'text' }),
                autoComplete: 'name',
              }}
              errors={fields.fullname.errors}
            />

            <Field
              labelProps={{ htmlFor: fields.password.id, children: 'Password' }}
              inputProps={{
                ...getInputProps(fields.password, { type: 'password' }),
                autoComplete: 'new-password',
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
              }}
              errors={fields.confirmPassword.errors}
            />

            <CheckboxField
              labelProps={{
                htmlFor: fields.agreeToTermsOfServiceAndPrivacyPolicy.id,
                children:
                  'Do you agree to our Terms of Service and Privacy Policy?',
              }}
              // @ts-expect-error @ts-ignore
              buttonProps={{
                ...getInputProps(fields.agreeToTermsOfServiceAndPrivacyPolicy, {
                  type: 'checkbox',
                }),
                value: 'true',
              }}
              errors={fields.agreeToTermsOfServiceAndPrivacyPolicy.errors}
            />
            <CheckboxField
              labelProps={{
                htmlFor: fields.remember.id,
                children: 'Remember me',
              }}
              // @ts-expect-error @ts-ignore
              buttonProps={{
                ...getInputProps(fields.remember, { type: 'checkbox' }),
                value: 'true',
              }}
              errors={fields.remember.errors}
            />

            <ErrorList errors={form.errors} id={form.errorId} />
          </CardContent>
          <CardFooter>
            <StatusButton
              className="w-full"
              status={isPending ? 'pending' : (actionData?.status ?? 'idle')}
              type="submit"
              disabled={isPending}
            >
              Create an account
            </StatusButton>
          </CardFooter>
          <CardFooter>
            <p className="mt-4 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
