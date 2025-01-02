import { json, LoaderFunctionArgs, type LinksFunction } from '@remix-run/node'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from '@remix-run/react'
import stylesheet from '~/tailwind.css?url'
import Navbar from './components/navbar'
import {
  authSessionStorage,
  themeSessionResolver,
} from './services/session.server'
import { PreventFlashOnWrongTheme, ThemeProvider, useTheme } from 'remix-themes'
import { prisma } from './db.server'
import fontStyles from '~/fonts.css?url'
import { getToast } from 'remix-toast'
import { useEffect } from 'react'
import { useToast } from './hooks/use-toast'
import { Toaster } from './components/ui/toaster'
import Footer from './components/footer'
import Banner from './components/banner'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'stylesheet', href: fontStyles },
]

export async function loader({ request }: LoaderFunctionArgs) {
  const { getTheme } = await themeSessionResolver(request)
  const { toast, headers } = await getToast(request)
  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  const userId = cookieSession.get('userId')
  const user = userId
    ? await prisma.user.findUnique({
        include: {
          doctor: {
            select: {
              id: true,
            },
          },
        },
        where: { id: userId },
      })
    : null
  return json(
    {
      user: user,
      isDoctor: Boolean(user?.doctor?.id),
      theme: getTheme(),
      toast,
    },
    { headers },
  )
}

export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>()
  return (
    <ThemeProvider specifiedTheme={data.theme} themeAction="/action/set-theme">
      <App />
    </ThemeProvider>
  )
}

export function App() {
  const {
    user,
    theme: loaderTheme,
    toast,
    isDoctor,
  } = useLoaderData<typeof loader>()
  const [theme] = useTheme()
  const { toast: notify } = useToast()
  const location = useLocation()
  const isSearchPage = location.pathname === '/search'

  useEffect(() => {
    if (toast) {
      notify({
        title: toast.message,
        type: 'foreground',
        variant: toast.type === 'error' ? 'destructive' : 'default',
      })
    }
  }, [toast, notify])
  return (
    <html lang="en" data-theme={theme ?? ''}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(loaderTheme)} />
        <Links />
      </head>
      <body className="bg-background">
        <div>
          <Toaster />
          {!isSearchPage ? (
            <>
              <Banner />
              <Navbar username={user?.username} isDoctor={isDoctor} />
            </>
          ) : null}
          <Outlet />
          {!isSearchPage && <Footer />}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
