import { z } from 'zod'
import { generateTOTP, verifyTOTP } from '~/services/totp.server'
import { prisma } from '~/db.server'
import { getDomainUrl } from '~/utils/misc'

export const codeQueryParam = 'code'
export const targetQueryParam = 'target'
export const typeQueryParam = 'type'
export const redirectToQueryParam = 'redirectTo'
const types = ['onboarding', 'reset-password', 'change-email', '2fa'] as const
const VerificationTypeSchema = z.enum(types)
export type VerificationTypes = z.infer<typeof VerificationTypeSchema>

export function getRedirectToUrl({
  request,
  type,
  target,
  redirectTo,
}: {
  request: Request
  type: VerificationTypes
  target: string
  redirectTo?: string
}) {
  const redirectToUrl = new URL(`${getDomainUrl(request)}/verify`)
  redirectToUrl.searchParams.set(typeQueryParam, type)
  redirectToUrl.searchParams.set(targetQueryParam, target)
  if (redirectTo) {
    redirectToUrl.searchParams.set(redirectToQueryParam, redirectTo)
  }
  return redirectToUrl
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
