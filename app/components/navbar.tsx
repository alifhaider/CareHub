import { Theme, useTheme } from 'remix-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { Moon, Sun } from 'lucide-react'
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
        <div className="w-[400px]">
          {!isHidden && (
            <Form
              method="GET"
              action="/search"
              className="flex w-full items-center"
            >
              <Input
                name="s"
                className="rounded-l-xl rounded-r-none focus-visible:ring-offset-0"
                type="text"
                placeholder="Search for doctors, specialties, and more"
              />
              <Button className="rounded-l-none rounded-r-xl" type="submit">
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
            <Link to="/doctor/list-schedule">Become a doctor</Link>
          </Button>
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
            <>
              <Link to="/login" className="mr-4">
                Login
              </Link>
              <Link to="/signup">Sign Up</Link>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition-all"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme(Theme.LIGHT)}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(Theme.DARK)}>
                Dark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
