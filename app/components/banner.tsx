import { Link } from '@remix-run/react'

export default function Banner() {
  return (
    <section className="bg-primary-foreground py-4 text-sm text-primary">
      <div className="container mx-auto flex items-center justify-center">
        <p>
          Get 20% off on your first appointment.
          <Link to="/search" className="text-brand mx-2 underline">
            Find a doctor now.
          </Link>
          Save time and money.
        </p>
      </div>
    </section>
  )
}