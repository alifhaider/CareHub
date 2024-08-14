import { type ActionFunctionArgs, redirect } from '@remix-run/node'
import { authSessionStorage } from '~/services/session.server'

export async function loader() {
  return redirect('/')
}

export async function action({ request }: ActionFunctionArgs) {
  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  return redirect('/', {
    headers: {
      'set-cookie': await authSessionStorage.destroySession(cookieSession),
    },
  })
}
