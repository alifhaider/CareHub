import { Theme, useTheme } from 'remix-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { MenuIcon, Moon, Sun, User2, WorkflowIcon } from 'lucide-react'
import { Form, Link, useLocation } from '@remix-run/react'
import { Input } from './ui/input'

const hideSearchFieldForRoutes = ['search', 'login', 'signup']

export default function Navbar({ username }: { username?: string }) {
  const location = useLocation()
  const isHidden = hideSearchFieldForRoutes.some(route =>
    location.pathname.includes(route),
  )
  const [, setTheme] = useTheme()
  const linkItemClassName =
    'hover:bg-primary-foreground px-2 rounded-md py-1 flex items-center gap-2 cursor-pointer'
  return (
    <nav className="mx-auto flex h-[73px] max-w-7xl items-center justify-between border-b px-6 py-4 lg:px-0">
      <div className="flex w-full items-center justify-between">
        <a href="/" className="text-xl font-bold">
          Care<span className="text-lime-500">Hub</span>
        </a>
        <div className="w-[400px]">
          {!isHidden && (
            <Form
              method="GET"
              action="/search"
              className="flex w-full items-center"
            >
              <Input
                name="s"
                className="rounded-none border-x-0 border-b border-t-0 pl-0.5 focus-visible:border-b-2 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                type="text"
                placeholder="Search for doctors, specialties, and more"
              />
              <Button className="rounded-l-none rounded-r-md" type="submit">
                Search
              </Button>
            </Form>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="outline"
            className="h-7 rounded-none border-primary py-0 text-sm font-bold"
          >
            <Link to="/doctor/join">Become a doctor</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto px-3 py-2 transition-all"
              >
                <MenuIcon className="w-h-5 h-5" />
                <User2 className="w-h-5 h-5" />

                <span className="sr-only">Toggle Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="space-y-1 py-2 text-sm"
            >
              {username ? (
                <>
                  <Link to={`/profile/${username}`}>Profile</Link>
                  <Form action="/logout" method="POST">
                    <Button variant="destructive" type="submit">
                      Logout {username}
                    </Button>
                  </Form>
                </>
              ) : (
                <div className="flex flex-col px-1">
                  <Link
                    className="rounded-md px-2 py-1 hover:bg-primary-foreground"
                    to="/login"
                  >
                    Login
                  </Link>
                  <Link
                    className="rounded-md px-2 py-1 hover:bg-primary-foreground"
                    to="/signup"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              <DropdownMenuItem
                onClick={() => setTheme(Theme.LIGHT)}
                className={linkItemClassName}
              >
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 transition-all" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(Theme.DARK)}
                className={linkItemClassName}
              >
                <Moon className="h-[1.2rem] w-[1.2rem] scale-100 transition-all" />
                Dark
              </DropdownMenuItem>

              <hr className="border-primary-foreground" />
              <Link to="/works" className={linkItemClassName}>
                <WorkflowIcon className="h-4 w-4" />
                How CareHub works
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
