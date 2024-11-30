import { type FieldMetadata, getInputProps } from '@conform-to/react'
import { type ScheduleLocation } from '@prisma/client'
import { json, LoaderFunctionArgs } from '@remix-run/node'
import { Link, useFetcher } from '@remix-run/react'
import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { useId } from 'react'
import { useSpinDelay } from 'spin-delay'
import { ErrorList } from '~/components/forms'
import { Spinner } from '~/components/spinner'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { prisma } from '~/db.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const query = searchParams.get('query')?.toLocaleLowerCase() ?? ''
  const locations = await prisma.scheduleLocation.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { address: { contains: query } },
        { city: { contains: query } },
        { state: { contains: query } },
        { zip: { contains: query } },
      ],
    },
    select: {
      id: true,
      name: true,
      address: true,
    },
  })
  return json({ items: locations })
}

export function LocationCombobox({
  field,
  selectedLocation,
}: {
  field: FieldMetadata
  selectedLocation?: Omit<ScheduleLocation, 'createdAt' | 'updatedAt'>
}) {
  const locationFetcher = useFetcher<typeof loader>()
  const id = useId()

  const items = locationFetcher.data?.items ?? []

  const cb = useCombobox<Pick<ScheduleLocation, 'id' | 'name' | 'address'>>({
    id,
    items,
    itemToString: item => (item ? item.name : ''),
    initialSelectedItem: selectedLocation,
    onInputValueChange: changes => {
      locationFetcher.submit(
        { query: changes.inputValue ?? '' },
        { method: 'get', action: '/resources/location-combobox' },
      )
    },
  })

  const displayMenu = cb.isOpen && items.length > 0
  const menuClassName =
    'absolute z-10 mt-4 min-w-[448px] max-h-[336px] bg-background shadow-lg rounded-3xl w-full overflow-y-scroll'

  const busy = locationFetcher.state !== 'idle'
  const showSpinner = useSpinDelay(busy, {
    delay: 150,
    minDuration: 300,
  })
  const errorId = field.errors?.length ? `${id}-error` : undefined

  return (
    <div className="relative">
      <div className="group relative space-y-2">
        <Label htmlFor={id}>Location</Label>
        <div className="relative">
          <Input
            aria-invalid={errorId ? true : undefined}
            aria-describedby={errorId}
            className="relative caret-black outline-none"
            {...cb.getInputProps({ id, placeholder: 'Choose a location' })}
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center">
            <Spinner showSpinner={showSpinner} />
          </div>
        </div>
      </div>

      <ul
        {...cb.getMenuProps({
          className: clsx(menuClassName, { hidden: !displayMenu }),
        })}
      >
        {displayMenu
          ? items.map((item, index) => (
              <li
                className="my-2 cursor-pointer px-6 py-1 hover:bg-primary-foreground"
                key={item.id}
                {...cb.getItemProps({ item: item, index })}
              >
                <div
                  className={`flex w-full items-center gap-2 rounded-full px-2 py-2 ${
                    cb.highlightedIndex === index ? 'bg-night-100' : ''
                  }`}
                >
                  <div className="flex items-end">
                    <strong>{item.name}</strong>/
                    <span className="mb-0.5 text-xs text-secondary-foreground">
                      {item.address}
                    </span>
                  </div>
                </div>
              </li>
            ))
          : null}
      </ul>
      <input
        {...getInputProps(field, { type: 'hidden' })}
        value={cb.selectedItem?.id}
      />
      <div className="min-h-4">
        <ErrorList errors={field.errors} />
      </div>

      <p className="mt-0.5 text-xs">
        <strong>Hint:</strong> If you don&apos;t see the location you&apos;re
        looking for, try typing or{' '}
        <Link className="underline" to="/add/location">
          add a new location
        </Link>
        .
      </p>
    </div>
  )
}
