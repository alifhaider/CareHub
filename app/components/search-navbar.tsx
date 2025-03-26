import { Link } from 'react-router';
import { Menu } from './navbar'
import { LocationCombobox } from '~/routes/resources.location-combobox'
import { type FieldMetadata } from '@conform-to/react'
import { SpecialtyCombobox } from '~/routes/resources.specialty-combobox'

export default function SearchNavbar({
  locationField,
}: {
  locationField: FieldMetadata
}) {
  return (
    <nav className="sticky inset-0 z-50 flex w-full items-center justify-between border-b bg-background px-4 py-4 lg:px-8">
      <div className="flex w-full items-center gap-6">
        <Link to="/" className="hidden font-bold md:block">
          Care<span className="text-lime-500">Hub</span>
        </Link>

        <div className="flex w-full gap-8">
          <div className="flex w-full max-w-[350px] items-center gap-2 border-b">
            <label htmlFor="name" className="text-brand">
              Who
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full bg-transparent focus:outline-none"
              placeholder="Dr. Ahmed"
            />
          </div>

          <LocationCombobox field={locationField} variant="search" />
          <SpecialtyCombobox />
        </div>
      </div>

      <Menu />
    </nav>
  )
}
