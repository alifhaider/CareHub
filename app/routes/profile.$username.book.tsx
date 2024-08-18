import { LoaderFunctionArgs } from "@remix-run/node"
import { requireUser } from "~/services/auth.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request)
  return { userId }
}

export default function Booking() {
  return (
    <div>
      <h1>Booking</h1>
    </div>
  )
}