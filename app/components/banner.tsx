import { Link } from 'react-router';

export default function Banner() {
  return (
    <section className="bg-primary-foreground py-4 text-sm text-primary">
      <div className="mx-auto flex items-center justify-center">
        <p className="font-bold">
          Get <span className="font-extrabold text-red-500">20%</span> off on
          your first appointment.
          <Link to="/search" className="mx-2 text-brand underline">
            Find a doctor now.
          </Link>
          Save time and money.
        </p>
      </div>
    </section>
  )
}
