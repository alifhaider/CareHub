import { ScheduleLocation } from '@prisma/client'
import { json, LoaderFunctionArgs } from '@remix-run/node'
import { useFetcher, useSearchParams } from '@remix-run/react'
import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { useId } from 'react'
import { useSpinDelay } from 'spin-delay'
import { Spinner } from '~/components/spinner'
import { Input } from '~/components/ui/input'
import { prisma } from '~/db.server'

export async function loader({ request }: LoaderFunctionArgs) {
  console.log('running location-combobox loader')
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
      ]
    },
    select: {
      id: true,
      name: true,
    },
  })
  console.log('locations', locations)
  return json({ items: locations })
}

export function LocationCombobox() {
  const [searchParams, setSearchParams] = useSearchParams()
  const locationFetcher = useFetcher<typeof loader>()
  const id = useId()

  // TODO: make this type better
  const items = locationFetcher.data?.items ?? []

  const cb = useCombobox<Pick<ScheduleLocation, 'id' | 'name'>>({
    id,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        const newSP = new URLSearchParams({
          locationId: selectedItem.id.toString(),
        })
        setSearchParams(newSP)
      }
    },
    items,
    itemToString: item => (item ? item.name : ''),
    onInputValueChange: changes => {
      locationFetcher.submit(
        { query: changes.inputValue ?? '' },
        { method: 'get', action: '/resources/location-combobox' },
      )
    },
  })

  const displayMenu = cb.isOpen && items.length > 0
  const menuClassName =
    'absolute z-10 mt-4 min-w-[448px] max-h-[336px] bg-white text-night-400 shadow-lg rounded-3xl w-full overflow-scroll divide-solid divide-night-100 divide-y'

  const busy = locationFetcher.state !== 'idle'
  const showSpinner = useSpinDelay(busy, {
    delay: 150,
    minDuration: 300,
  })
  return (
    <div className="relative">
      <div className="group">
        <label
          htmlFor={id}
        >
          Hospital Name
        </label>
        <Input
          className="relative placeholder:text-foreground focus:border-accent-purple focus:text-night-500 focus:placeholder:text-night-500 caret-black outline-none focus:bg-white"
          {...cb.getInputProps({ id, placeholder: 'Choose a location' })}
        />
        <div className="absolute right-4 top-[44px]">
          <Spinner showSpinner={showSpinner} />
        </div>
        {/* TODO: display errors */}
      </div>
      <ul
        {...cb.getMenuProps({
          className: clsx(menuClassName, { hidden: !displayMenu }),
        })}
      >
        {displayMenu
          ? items.map((item, index) => (
              <li
                className="mx-6 cursor-pointer py-2"
                key={item.id}
                {...cb.getItemProps({ item: item, index })}
              >
                <div
                  className={`flex w-full items-center gap-2 rounded-full px-2 py-2 ${
                    cb.highlightedIndex === index ? 'bg-night-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">{item.name}</div>
                </div>
              </li>
            ))
          : null}
      </ul>
    </div>
  )
}
