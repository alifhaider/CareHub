import { Theme, useTheme } from 'remix-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import {
  BriefcaseMedical,
  DoorOpen,
  MenuIcon,
  Moon,
  Search,
  Sun,
  User2,
  WorkflowIcon,
} from 'lucide-react'
import { Form, Link, useLocation } from '@remix-run/react'
import { Input } from './ui/input'

const hideSearchFieldForRoutes = ['search', 'login', 'signup']

export default function Navbar({ username }: { username?: string }) {
  const location = useLocation()
  const isHidden = hideSearchFieldForRoutes.some(route =>
    location.pathname.includes(route),
  )
  const [, setTheme] = useTheme()
  return (
    <nav className="mx-auto flex h-[73px] max-w-7xl items-center justify-between border-b px-6 py-4 lg:px-0">
      <div className="flex w-full items-center justify-between">
        <a href="/" className="text-xl font-bold">
          Care<span className="text-lime-500">Hub</span>
        </a>
        <div className="hidden w-[400px] lg:block">
          {!isHidden && (
            <Form
              method="GET"
              action="/search"
              className="relative flex w-full items-center"
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search
                  className="h-5 w-5 text-muted-foreground dark:text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <Input
                className="w-full rounded-full border-2 border-transparent bg-secondary py-2 pl-10 pr-4 text-sm leading-6 text-foreground transition-all duration-300 ease-in-out focus:border-primary focus:bg-background focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-foreground dark:focus:bg-gray-700"
                placeholder="Search..."
                type="search"
                name="s"
              />
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
                      <DoorOpen className="h-4 w-4" />
                      Logout {username}
                    </Button>
                  </Form>
                </>
              ) : (
                <div className="flex flex-col px-1">
                  <Link to="/login">
                    <DropdownMenuItem>Login</DropdownMenuItem>
                  </Link>
                  <Link to="/signup">
                    <DropdownMenuItem>Sign Up</DropdownMenuItem>
                  </Link>
                </div>
              )}
              <Link to="/doctor/join">
                <DropdownMenuItem>
                  <BriefcaseMedical className="h-4 w-4" />
                  Become a doctor
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => setTheme(Theme.LIGHT)}>
                <Sun className="h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(Theme.DARK)}>
                <Moon className="h-4 w-4" />
                Dark
              </DropdownMenuItem>

              <hr className="border-primary-foreground" />
              <Link to="/works">
                <DropdownMenuItem>
                  <WorkflowIcon className="h-4 w-4" />
                  How CareHub works
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
