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
  LogOut,
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

export default function Navbar({
  username,
  isDoctor = false,
}: {
  username?: string
  isDoctor?: boolean
}) {
  const location = useLocation()
  const isHidden = hideSearchFieldForRoutes.some(route =>
    location.pathname.includes(route),
  )
  const [, setTheme] = useTheme()
  return (
    <nav className="sticky inset-0 z-50 mx-auto flex h-[73px] items-center justify-between border-b bg-background px-4 py-4 lg:px-12">
      <div className="flex w-full items-center justify-between">
        <a href="/" className="font-bold">
          Care<span className="text-lime-500">Hub</span>
        </a>
        <div className="hidden w-full max-w-xl lg:block">
          {!isHidden && (
            <Form
              method="GET"
              action="/search"
              className="relative flex w-full items-center"
            >
              <div className="absolute right-0 mr-2 flex cursor-pointer items-center rounded-full bg-primary px-2 py-2">
                <button type="submit">
                  <Search
                    className="h-3 w-3 text-primary-foreground dark:text-gray-400"
                    aria-hidden="true"
                  />
                </button>
                {/* 
                <button type="submit" className="sr-only">
                  Search
                </button> */}
              </div>
              <Input
                className="w-full rounded-full border-2 border-transparent bg-secondary py-2 pr-10 text-sm leading-6 text-foreground transition-all duration-300 ease-in-out focus:border-primary focus:bg-background focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-foreground dark:focus:bg-gray-700"
                placeholder="Search..."
                type="search"
                name="s"
              />
            </Form>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isDoctor ? (
            <Button
              asChild
              variant="outline"
              className="h-7 rounded-none border-primary py-0 text-sm font-bold"
            >
              <Link to="/doctor/dashboard/overview">Dashboard</Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="h-7 rounded-none border-primary py-0 text-sm font-bold"
            >
              <Link to="/doctor/join">Become a doctor</Link>
            </Button>
          )}

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
                  <Link to={`/profile/${username}`}>
                    <DropdownMenuItem>
                      <User2 className="h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
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
              {isDoctor ? (
                <Link to="/doctor/dashboard/overview">
                  <DropdownMenuItem>
                    <BriefcaseMedical className="h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                </Link>
              ) : (
                <Link to="/doctor/join">
                  <DropdownMenuItem>
                    <BriefcaseMedical className="h-4 w-4" />
                    Become a doctor
                  </DropdownMenuItem>
                </Link>
              )}

              <hr className="border-primary-foreground" />

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

              {username && (
                <>
                  <hr className="border-primary-foreground" />
                  <Form action="/logout" method="POST" className="w-full">
                    <button type="submit" className="w-full">
                      <DropdownMenuItem>
                        <LogOut className="h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </button>
                  </Form>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
