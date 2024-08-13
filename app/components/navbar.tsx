import { Theme, useTheme } from "remix-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import { Form, Link } from "@remix-run/react";

export default function Navbar({ username }: { username?: string }) {
  const [, setTheme] = useTheme();
  return (
    <nav className="flex items-center justify-between py-4 border-b max-w-7xl mx-auto">
      <div>
        <a href="/" className="font-bold text-xl">
          CareHub
        </a>
      </div>
      <div className="flex items-center gap-4">
        {username ? (
          <Form action="/logout" method="POST">
            <Button variant="destructive" type="submit">
              Logout {username}
            </Button>
          </Form>
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
              className="w-8 h-8 transition-all"
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
    </nav>
  );
}
