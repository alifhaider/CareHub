import { Link } from '@remix-run/react'
import { Menu } from './navbar'
import { LocationCombobox } from '~/routes/resources.location-combobox'
import { type FieldMetadata } from '@conform-to/react'

export default function SearchNavbar({
  locationField,
  fromField,
  toField,
}: {
  locationField: FieldMetadata
  fromField: FieldMetadata
  toField: FieldMetadata
}) {
  return (
    <nav className="sticky inset-0 z-50 flex w-full items-center justify-between border-b bg-background px-4 py-4 lg:px-8">
      <div className="flex w-full items-center gap-6">
        <Link to="/" className="hidden font-bold md:block">
          Care<span className="text-lime-500">Hub</span>
        </Link>
        <div className="flex w-full gap-8">
          <LocationCombobox field={locationField} variant="search" />
          <DateRangePicker fromField={fromField} toField={toField} />
        </div>
      </div>

      <Menu />
    </nav>
  )
}

const DateRangePicker = ({
  fromField,
  toField,
}: {
  fromField: FieldMetadata
  toField: FieldMetadata
}) => {
  return (
    <div className="flex flex-1 items-center gap-4">
      <div className="flex w-full max-w-[350px] items-center gap-2 border-b">
        <label htmlFor={fromField.id} className="text-brand">
          From
        </label>
        <input className="w-full bg-transparent" />
      </div>
      <div className="flex w-full max-w-[350px] items-center gap-2 border-b">
        <label htmlFor={toField.id} className="text-brand">
          To
        </label>
        <input className="w-full bg-transparent" />
      </div>
    </div>
  )
}
