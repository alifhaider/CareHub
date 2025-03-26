import { redirect } from 'react-router'
import { authSessionStorage } from '~/services/session.server'
import { Route } from './+types/logout'

export async function loader() {
  return redirect('/')
}

export async function action({ request }: Route.ActionArgs) {
  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  return redirect('/', {
    headers: {
      'set-cookie': await authSessionStorage.destroySession(cookieSession),
    },
  })
}
