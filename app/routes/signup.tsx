import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
} from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
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

const SignupFormSchema = z
  .object({
    username: UsernameSchema,
    email: EmailSchema,
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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  console.log('formData in action', Object.fromEntries(formData))
  // await validateCSRF(formData, request.headers)
  // checkHoneypot(formData)
  const submission = await parseWithZod(formData, {
    schema: SignupFormSchema.superRefine(async (data, ctx) => {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
        select: { id: true },
      })
      if (existingUser) {
        ctx.addIssue({
          path: ['username'],
          code: z.ZodIssueCode.custom,
          message: 'A user already exists with this username',
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
    return json(submission.reply())
  }

  const { user, remember } = submission.value

  const cookieSession = await sessionStorage.getSession(
    request.headers.get('cookie'),
  )
  cookieSession.set('userId', user.id)

  return redirect('/', {
    headers: {
      'set-cookie': await sessionStorage.commitSession(cookieSession, {
        expires: remember === 'true' ? getSessionExpirationDate() : undefined,
      }),
    },
  })
}

export const meta: MetaFunction = () => {
  return [{ title: 'Signup / CH' }]
}

export default function SignupRoute() {
  const actionData = useActionData<typeof action>()
  const isPending = useIsPending()

  const [form, fields] = useForm({
    id: 'signup-form',
    lastResult: actionData,
    onValidate({ formData }) {
      console.log('formData', Object.fromEntries(formData))
      return parseWithZod(formData, { schema: SignupFormSchema })
    },
    shouldRevalidate: 'onBlur',
  })

  return (
    <div className="container flex min-h-full flex-col justify-center pb-32 pt-20">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-h1">Welcome aboard!</h1>
          <p className="text-body-md text-muted-foreground">
            Please enter your details.
          </p>
        </div>
        <div className="mt-10" />
        <Form
          method="POST"
          className="mx-auto min-w-[368px] max-w-sm"
          {...getFormProps(form)}
        >
          {/* <AuthenticityTokenInput /> */}
          {/* <HoneypotInputs /> */}
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
          <Field
            labelProps={{ htmlFor: fields.username.id, children: 'Username' }}
            inputProps={{
              ...getInputProps(fields.username, { type: 'text' }),
              autoComplete: 'username',
              className: 'lowercase',
            }}
            errors={fields.username.errors}
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

              autoComplete: 'new-password',
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

          <div className="flex items-center justify-between gap-6">
            <StatusButton
              className="w-full"
              status={isPending ? 'pending' : (actionData?.status ?? 'idle')}
              type="submit"
              disabled={isPending}
            >
              Create an account
            </StatusButton>
          </div>
        </Form>
      </div>
    </div>
  )
}
