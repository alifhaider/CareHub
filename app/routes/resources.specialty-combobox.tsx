import { DoctorSpecialty } from '@prisma/client'
import { useFetcher, data } from 'react-router'
import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { useId } from 'react'
import { useSpinDelay } from 'spin-delay'
import { Spinner } from '~/components/spinner'
import { prisma } from '~/db.server'
import { Route } from './+types/resources.specialty-combobox'

export async function loader({ request }: Route.LoaderArgs) {
  const searchParams = new URL(request.url).searchParams
  const query = searchParams.get('query')?.toLocaleLowerCase() ?? ''
  const specialties = await prisma.doctorSpecialty.findMany({
    where: { name: { contains: query } },
    distinct: ['name'],
  })

  return data({ items: specialties })
}

export function SpecialtyCombobox() {
  const specialtyFetcher = useFetcher<typeof loader>()
  const id = useId()

  const items = specialtyFetcher.data?.items ?? []
  const cb = useCombobox<Pick<DoctorSpecialty, 'id' | 'name'>>({
    id,
    items,
    itemToString: item => (item ? item.name : ''),
    onInputValueChange: changes => {
      specialtyFetcher.submit(
        { query: changes.inputValue ?? '' },
        { method: 'get', action: '/resources/specialty-combobox' },
      )
    },
  })

  const displayMenu = cb.isOpen && items.length > 0
  const menuClassName =
    'absolute z-10 mt-4 min-w-[448px] max-h-[336px] bg-background shadow-lg rounded-sm w-full overflow-y-scroll'

  const busy = specialtyFetcher.state !== 'idle'
  const showSpinner = useSpinDelay(busy, {
    delay: 150,
    minDuration: 300,
  })
  return (
    <div className="relative max-w-[350px] flex-1">
      <div className="flex w-full max-w-[350px] flex-1 items-center gap-4 border-b">
        <label htmlFor={id} className="text-brand">
          Which
        </label>
        <div className="relative w-full">
          <input
            className="relative w-full bg-transparent outline-none"
            {...cb.getInputProps({
              id,
              placeholder: 'Cardiologist, Dentist...',
            })}
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
                className="my-2 cursor-pointer py-1 hover:text-brand"
                key={item.id}
                {...cb.getItemProps({ item: item, index })}
              >
                <div
                  className={`flex w-full items-center gap-2 rounded-sm border border-transparent px-2 py-2 transition-all ${
                    cb.highlightedIndex === index
                      ? 'border-brand text-brand'
                      : ''
                  }`}
                >
                  <div className="flex items-end">
                    <strong>{item.name}</strong>
                  </div>
                </div>
              </li>
            ))
          : null}
      </ul>
      <input name="specialty" type="hidden" value={cb.selectedItem?.id} />
    </div>
  )
}
