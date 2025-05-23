import { type Password, type User } from '@prisma/client'
import { redirect } from 'react-router';
import bcrypt from 'bcryptjs'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { prisma } from '~/db.server'
import { combineResponseInits } from '~/utils/misc'
import { authSessionStorage } from './session.server'

const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30 // 30 days

export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME)

export const userIdKey = 'userId'

export async function getUserId(request: Request) {
  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  const userId = cookieSession.get(userIdKey)
  if (!userId) return null
  const user = await prisma.user.findUnique({
    select: { id: true },
    where: { id: userId },
  })
  if (!user) {
    throw await logout({ request })
  }
  return user.id
}

export async function requireUserId(
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {},
) {
  const userId = await getUserId(request)
  if (!userId) {
    const requestUrl = new URL(request.url)
    redirectTo =
      redirectTo === null
        ? null
        : (redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`)
    const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null
    const loginRedirect = ['/login', loginParams?.toString()]
      .filter(Boolean)
      .join('?')
    throw redirect(loginRedirect)
  }
  return userId
}

// throws a redirect to / if authenticated
export async function requireAnonymous(request: Request) {
  const userId = await getUserId(request)
  if (userId) {
    throw redirect('/')
  }
}

// returns user if authenticated, otherwise throws a redirect to login
export async function requireUser(request: Request) {
  const userId = await requireUserId(request)
  const user = await prisma.user.findUnique({
    select: { id: true, username: true, fullName: true, phone: true },
    where: { id: userId },
  })
  if (!user) {
    throw await logout({ request })
  }
  return user
}

export async function requireDoctor(request: Request) {
  const userId = await requireUserId(request)
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    include: { user: { select: { id: true, username: true } } },
  })
  if (!doctor) {
    throw redirect('/')
  }
  return doctor
}

export async function login({
  username,
  password,
}: {
  username: User['username']
  password: string
}) {
  return verifyUserPassword({ username }, password)
}

export async function signup({
  email,
  username,
  password,
}: {
  email: User['email']
  username: User['username']
  password: string
}) {
  const hashedPassword = await getPasswordHash(password)

  const user = await prisma.user.create({
    select: { id: true },
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  })

  return user
}

export async function logout(
  {
    request,
    redirectTo = '/',
  }: {
    request: Request
    redirectTo?: string
  },
  responseInit?: ResponseInit,
) {
  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  throw redirect(
    safeRedirect(redirectTo),
    combineResponseInits(responseInit, {
      headers: {
        'set-cookie': await authSessionStorage.destroySession(cookieSession),
      },
    }),
  )
}

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10)
  return hash
}

export async function verifyUserPassword(
  where: Pick<User, 'username'> | Pick<User, 'id'>,
  password: Password['hash'],
) {
  const userWithPassword = await prisma.user.findUnique({
    where,
    select: { id: true, password: { select: { hash: true } } },
  })

  if (!userWithPassword || !userWithPassword.password) {
    return null
  }

  const isValid = await bcrypt.compare(password, userWithPassword.password.hash)

  if (!isValid) {
    return null
  }

  return { id: userWithPassword.id }
}

export async function resetUserPassword({
  username,
  password,
}: {
  username: User['username']
  password: string
}) {
  const hashedPassword = await getPasswordHash(password)
  return prisma.user.update({
    where: { username },
    data: {
      password: {
        update: {
          hash: hashedPassword,
        },
      },
    },
  })
}
