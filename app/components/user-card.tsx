import { Link } from '@remix-run/react'
import { Star } from 'lucide-react'
import { Button } from './ui/button'

type UserCardProps = {
  username: string
  doctor: {
    fullName: string | null
    rating: number
    bio: string
    _count: {
      schedules: number
    }
    specialties: {
      id: string
      name: string
    }[]
  } | null
}

export default function UserCard({ doctor, username }: UserCardProps) {
  return (
    <li className="h-full">
      <div className="flex h-full flex-col justify-between rounded-sm border bg-background py-4 hover:shadow-lg">
        <div className="relative mx-auto h-20 w-20 rounded-sm bg-secondary">
          <div className="absolute -bottom-1 left-1/2 flex w-max -translate-x-1/2 items-center justify-center gap-0.5 rounded-md bg-secondary-foreground px-1 text-xs text-background shadow-lg">
            <Star className="h-3 w-3" />
            {doctor?.rating}
          </div>
        </div>
        <Link
          to={`/profile/${username}`}
          className="group mt-2 flex items-end justify-center px-4"
        >
          <h3 className="text-lg font-semibold group-hover:underline">
            {doctor?.fullName ?? username}
          </h3>
        </Link>
        <ul className="mt-4 flex flex-wrap justify-between text-sm">
          {doctor?.specialties.map(specialty => (
            <li key={specialty.id} className="flex items-center gap-1 px-4">
              <div className="h-2 w-2 rounded-full bg-amber-300"></div>
              {specialty.name}
            </li>
          ))}
        </ul>

        <p className="mt-4 px-4 text-sm">{doctor?.bio}</p>

        <p className="mt-4 px-4 text-sm">
          <strong>Total schedules:</strong> {doctor?._count.schedules}
        </p>
        <Button asChild className="mx-4 mt-4">
          <Link to={`/profile/${username}`}>Book appointment</Link>
        </Button>
      </div>
    </li>
  )
}
