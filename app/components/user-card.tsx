import { Link } from '@remix-run/react'
import { Star, PercentSquareIcon } from 'lucide-react'
import { Button } from './ui/button'

type UserCardProps = {
  username: string
  fullName: string | null
  doctor: {
    rating: number
    bio: string
    _count: {
      schedules: number
    }
    image: string | null
    specialties: {
      id: string
      name: string
    }[]
  } | null
}

export default function UserCard({
  doctor,
  username,
  fullName,
}: UserCardProps) {
  return (
    <li className="h-full">
      <div className="flex h-full flex-col justify-between rounded-lg border bg-background bg-blue-400 py-4 hover:shadow-lg">
        <div className="relative mx-auto h-20 w-20 rounded-sm bg-secondary">
          <img
            src={doctor?.image ?? '/avatar.png'}
            alt={fullName ?? username}
            className="h-full w-full rounded-sm object-cover"
          />
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
            {fullName ?? username}
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
          <Link to={`/profile/${username}`}>Check Schedules</Link>
        </Button>
      </div>
    </li>
  )
}
