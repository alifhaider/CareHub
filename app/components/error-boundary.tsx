import { useEffect } from 'react'
import { captureException } from '@sentry/react'
import {
  isRouteErrorResponse,
  useParams,
  useRouteError,
  type ErrorResponse,
} from 'react-router'
import { getErrorMessage } from '~/utils/misc'

type StatusHandler = (info: {
  error: ErrorResponse
  params: Record<string, string | undefined>
}) => JSX.Element | null

export function GeneralErrorBoundary({
  defaultStatusHandler = ({ error }) => (
    <p>
      {error.status} {getErrorMessage(error.data)}
    </p>
  ),
  statusHandlers,
  unexpectedErrorHandler = error => <p>{getErrorMessage(error)}</p>,
}: {
  defaultStatusHandler?: StatusHandler
  statusHandlers?: Record<number, StatusHandler>
  unexpectedErrorHandler?: (error: unknown) => JSX.Element | null
}) {
  const error = useRouteError()
  const params = useParams()

  if (typeof document !== 'undefined') {
    console.error(error)
  }

  useEffect(() => {
    captureException(error)
  }, [error])

  return (
    <div className="text-h2 container flex h-full w-full items-center justify-center bg-destructive p-20 text-destructive-foreground">
      {isRouteErrorResponse(error)
        ? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
            error,
            params,
          })
        : unexpectedErrorHandler(error)}
    </div>
  )
}
