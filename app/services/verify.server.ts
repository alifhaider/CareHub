import { Submission } from '@conform-to/react'
import { z } from 'zod'

export const codeQueryParam = 'code'
export const targetQueryParam = 'target'
export const typeQueryParam = 'type'
export const redirectToQueryParam = 'redirectTo'
const types = ['onboarding', 'reset-password', 'change-email', '2fa'] as const
const VerificationTypeSchema = z.enum(types)
export type VerificationTypes = z.infer<typeof VerificationTypeSchema>

export const VerifySchema = z.object({
  [codeQueryParam]: z.string().min(6).max(6),
  [typeQueryParam]: VerificationTypeSchema,
  [targetQueryParam]: z.string(),
  [redirectToQueryParam]: z.string().optional(),
})

export type VerifyFunctionArgs = {
  request: Request
  submission: Submission<
    z.input<typeof VerifySchema>,
    string[],
    z.output<typeof VerifySchema>
  >
  body: FormData | URLSearchParams
}

export async function prepareVerification({
  period,
  request,
  type,
  target,
}: {
  period: number
  request: Request
  type: VerificationTypes
  target: string
}) {
  const verifyUrl = getRedirectToUrl({ request, type, target })
  const redirectTo = new URL(verifyUrl.toString())

  const { otp, ...verificationConfig } = await generateTOTP({
    algorithm: 'SHA-256',
    // Leaving off 0, O, and I on purpose to avoid confusing users.
    charSet: 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789',
    period,
  })
  const verificationData = {
    type,
    target,
    ...verificationConfig,
    expiresAt: new Date(Date.now() + verificationConfig.period * 1000),
  }
  await prisma.verification.upsert({
    where: { target_type: { target, type } },
    create: verificationData,
    update: verificationData,
  })

  // add the otp to the url we'll email the user.
  verifyUrl.searchParams.set(codeQueryParam, otp)

  return { otp, redirectTo, verifyUrl }
}
