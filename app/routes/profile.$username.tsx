import {
  data,
  type LoaderFunctionArgs,
  type MetaFunction,
  Form,
  Link,
  useFetcher,
} from 'react-router'
import { format, isPast } from 'date-fns'
import {
  BadgeDollarSign,
  CalendarDays,
  Clock,
  CoinsIcon,
  GraduationCap,
  MailIcon,
  MapPin,
  Settings,
  Star,
  StarIcon,
  Stethoscope,
  UserIcon,
} from 'lucide-react'
import React from 'react'
import { DayProps } from 'react-day-picker'
import { jsonWithError, jsonWithSuccess } from 'remix-toast'
import { ErrorList, TextareaField } from '~/components/forms'
import { Spacer } from '~/components/spacer'
import { PageTitle, SectionTitle } from '~/components/typography'
import { Avatar } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Calendar, CustomCell } from '~/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { prisma } from '~/db.server'
import { requireDoctor, requireUser } from '~/services/auth.server'
import { authSessionStorage } from '~/services/session.server'
import { invariantResponse } from '~/utils/misc'
import { z } from 'zod'
import {
  formatTime,
  getUpcomingDateSchedules,
  isScheduleInSixHours,
  TSchedule,
} from '~/utils/schedule'
import { getFormProps, getInputProps, Intent, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Label } from '~/components/ui/label'
import { Route } from './+types/profile.$username'

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    { title: `${data?.user.username} / CH` },
    { name: 'description', content: `CareHub ${data?.user.username} Profile!` },
  ]
}

const ReviewSchema = z.object({
  rating: z
    .number({ message: 'Please provide a rating' })
    .int({ message: 'Rating must be a whole number' })
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  doctorId: z.string(),
  userId: z.string(),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
})

function CreateScheduleDeleteSchema(
  intent: Intent | null,
  options?: {
    doesScheduleHaveBookings: (scheduleId: string) => Promise<boolean>
  },
) {
  return z
    .object({
      scheduleId: z.string(),
    })
    .pipe(
      z
        .object({
          scheduleId: z.string(),
        })
        .superRefine(async (data, ctx) => {
          const isValidatingSchedule =
            intent === null ||
            (intent.type === 'validate' && intent.payload.name === 'scheduleId')
          if (!isValidatingSchedule) {
            ctx.addIssue({
              code: 'custom',
              path: ['form'],
              message: 'Schedule validation process is not properly initiated.',
            })
            return
          }

          if (typeof options?.doesScheduleHaveBookings !== 'function') {
            ctx.addIssue({
              code: 'custom',
              path: ['form'],
              message: 'Booking check  validation function is not provided.',
              fatal: true,
            })
            return
          }

          try {
            // Check if the schedule has bookings
            const hasBookings = await options.doesScheduleHaveBookings(
              data.scheduleId,
            )

            if (hasBookings) {
              ctx.addIssue({
                code: 'custom',
                path: ['scheduleId'],
                message:
                  'The schedule cannot be deleted because it has existing bookings.',
              })
            }
          } catch (error) {
            ctx.addIssue({
              code: 'custom',
              path: ['form'],
              message:
                'An error occurred while validating the schedule. Please try again later.',
              fatal: true,
            })
          }
        }),
    )
}

const ScheduleDeleteSchema = z.object({
  scheduleId: z.string(),
})

type ReviewProps = {
  doctorId: string
  userId: string
  totalReviews: number | undefined
  overallRating: string | undefined
  reviews:
    | {
        user: {
          username: string
          fullName: string | null
        }
        id: string
        createdAt: string
        rating: number
        comment: string
      }[]
    | undefined
}

type ScheduleProps = {
  schedules: TSchedule[] | undefined
  isOwner: boolean
  isDoctor: boolean
  username: string
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const page = url.searchParams.get('page')
  const username = params.username
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cookieSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )

  // TODO: Delete old schedules
  // await prisma.schedule.deleteMany({
  //   where: {
  //     startTime: {
  //       lt: today, // Less than today
  //     },
  //   },
  // });

  const loggedInUserId = cookieSession.get('userId')
  const user = await prisma.user.findFirst({
    where: { username },
    include: {
      doctor: {
        include: {
          _count: {
            select: { reviews: true },
          },
          specialties: { select: { id: true, name: true } },
          education: {
            select: {
              id: true,
              degree: true,
              institute: true,
              year: true,
            },
          },
          schedules: {
            include: {
              _count: {
                select: { bookings: true },
              },
              location: {
                select: {
                  id: true,
                  address: true,
                  name: true,
                  city: true,
                  state: true,
                  zip: true,
                },
              },
            },
          },
          reviews: {
            skip: page ? (parseInt(page) - 1) * 5 : 0,
            take: 5,
            select: {
              id: true,
              rating: true,
              comment: true,
              user: {
                select: {
                  username: true,
                  fullName: true,
                },
              },
              createdAt: true,
            },
          },
        },
      },
      bookings: {
        include: {
          schedule: {
            select: {
              createdAt: true,
              date: true,
              startTime: true,
              endTime: true,
              location: {
                select: {
                  name: true,
                  address: true,
                  city: true,
                  state: true,
                  zip: true,
                },
              },
              depositAmount: true,
              serialFee: true,
              visitFee: true,
              discountFee: true,
            },
          },
          doctor: {
            select: {
              user: { select: { username: true, fullName: true } },
              image: true,
            },
          },
        },
      },
    },
  })

  invariantResponse(user, 'User not found', { status: 404 })
  const isOwner = user?.id === loggedInUserId
  const isDoctor = user?.doctor || false
  const totalReviewsCount = user.doctor?._count?.reviews
  const totalRating = user.doctor?.reviews.reduce(
    (acc, review) => acc + review.rating,
    0,
  )
  const overallRating =
    totalRating && totalReviewsCount
      ? Number(totalRating) / totalReviewsCount
      : 0

  return data({
    user,
    isOwner,
    isDoctor,
    loggedInUserId,
    overallRating: overallRating.toFixed(1),
  })
}

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request)
  const formData = await request.formData()
  const { _action } = Object.fromEntries(formData)

  async function createReview(formData: FormData) {
    const submission = parseWithZod(formData, { schema: ReviewSchema })

    if (submission.status !== 'success') {
      return jsonWithError(submission.reply(), {
        message: 'There was an error creating the review',
      })
    }

    const { doctorId, userId, comment, rating } = submission.value

    await prisma.review.create({
      data: {
        rating,
        comment,
        doctorId,
        userId,
      },
    })

    return jsonWithSuccess({}, { message: 'Review created successfully' })
  }

  async function deleteSchedule(formData: FormData) {
    await requireDoctor(request)
    const submission = await parseWithZod(formData, {
      schema: CreateScheduleDeleteSchema(null, {
        doesScheduleHaveBookings: async scheduleId => {
          const bookings = await prisma.booking.findMany({
            where: { scheduleId },
          })
          return bookings.length > 0
        },
      }),
      async: true,
    })

    if (submission.status !== 'success') {
      return jsonWithError(submission.reply(), {
        message: 'Schedule has bookings and cannot be deleted',
      })
    }

    const scheduleId = submission.value.scheduleId

    await prisma.schedule.delete({ where: { id: scheduleId } })

    return jsonWithSuccess({}, { message: 'Schedule removed successfully' })
  }

  async function cancelBooking(formData: FormData) {
    await requireUser(request)
    const submission = parseWithZod(formData, {
      schema: z.object({
        bookingId: z.string(),
      }),
    })

    if (submission.status !== 'success') {
      return jsonWithError(submission.reply(), {
        message: 'There was an error cancelling the booking',
      })
    }

    const bookingId = submission.value.bookingId

    await prisma.booking.delete({ where: { id: bookingId } })

    return jsonWithSuccess({}, { message: 'Booking cancelled successfully' })
  }

  switch (_action) {
    case 'create-review':
      return createReview(formData)
    case 'delete-schedule':
      return deleteSchedule(formData)
    case 'cancel-booking':
      return cancelBooking(formData)
    default:
      return jsonWithError({}, { message: 'Invalid action' })
  }
}

export default function User({ loaderData }: Route.ComponentProps) {
  const { isDoctor, isOwner, user, loggedInUserId, overallRating } = loaderData
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const schedules = user.doctor?.schedules ?? []

  const scheduleTimes = schedules?.map(schedule => ({
    id: schedule.id,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    date: new Date(schedule.date),
  }))

  function handleDateClick(date: Date | undefined) {
    if (!date) return
    setSelectedDate(date)
  }

  // Filter out schedules for the nearest day
  const upcomingDateSchedules = getUpcomingDateSchedules(schedules)

  const selectedDateSchedules = user.doctor?.schedules?.filter(schedule => {
    if (!selectedDate) return
    const scheduleDate = new Date(schedule.date)
    return (
      scheduleDate.getDate() === selectedDate.getDate() &&
      scheduleDate.getMonth() === selectedDate.getMonth() &&
      scheduleDate.getFullYear() === selectedDate.getFullYear()
    )
  })

  const displayedSchedules = selectedDate
    ? selectedDateSchedules
    : upcomingDateSchedules

  const specialties = user.doctor?.specialties.map(specialty => specialty.name)
  const highlightedDate = displayedSchedules && displayedSchedules[0]?.date

  return (
    <main className="container">
      <section className="flex-1">
        <Spacer variant="lg" />

        <div className="flex gap-6">
          {user.doctor?.image ? (
            <img
              src={user.doctor?.image}
              alt={user.username}
              className="h-32 w-32 rounded-sm shadow-sm"
            />
          ) : (
            <div className="h-32 w-32 rounded-sm bg-primary-foreground shadow-sm">
              <UserIcon className="h-32 w-32" />
            </div>
          )}

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <SectionTitle>{user.fullName ?? user.username}</SectionTitle>

              {isDoctor && isOwner ? (
                <Button asChild variant="outline">
                  <Link to="/profile/edit" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Profile Settings
                  </Link>
                </Button>
              ) : null}
            </div>
            {!isDoctor ? (
              <>
                <p className="flex items-center gap-2 text-sm text-accent-foreground">
                  <MailIcon className="h-4 w-4" />
                  {user.email}
                </p>
              </>
            ) : null}

            {isDoctor ? (
              <>
                <div
                  className="flex items-center gap-2 text-brand"
                  title="specialty"
                >
                  <div className="flex items-center rounded-lg border p-1.5">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <ul className="flex items-center gap-4 text-primary">
                    {specialties && specialties.length > 0 ? (
                      specialties.map((specialty, index) => (
                        <>
                          <li key={index}>{specialty}</li>
                          {index < specialties.length - 1 && (
                            <span className="text-accent-foreground">|</span>
                          )}
                        </>
                      ))
                    ) : (
                      <li>No specialties</li>
                    )}
                  </ul>
                </div>
                <div
                  className="flex items-start gap-2 text-brand"
                  title="education"
                >
                  <div className="flex items-center rounded-lg border p-1.5">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <ul className="text-accent-foreground">
                    {user.doctor?.education.map(education => (
                      <li key={education.id}>
                        {education.degree} | {education.institute}
                        <span className="ml-1 text-sm">({education.year})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </div>
        </div>
        <Spacer variant="md" />
        <p>{user.doctor?.bio}</p>
      </section>

      {isDoctor ? (
        <>
          <Spacer variant="lg" />
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <Calendar
              className="col-span-1 place-content-center p-0 lg:col-span-2 lg:items-start"
              onDayClick={handleDateClick}
              modifiers={{
                selectedDate: date =>
                  !!selectedDate &&
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear(),
                schedules: date =>
                  scheduleTimes.some(
                    schedule =>
                      date.getDate() === schedule.date.getDate() &&
                      date.getMonth() === schedule.date.getMonth() &&
                      date.getFullYear() === schedule.date.getFullYear(),
                  ),
              }}
              components={{
                Day: (props: DayProps) => (
                  <CustomCell
                    scheduleTimes={scheduleTimes}
                    highlightedDate={
                      highlightedDate ? new Date(highlightedDate) : undefined
                    }
                    {...props}
                  />
                ),
              }}
              formatters={{
                formatCaption: (date: Date) => format(date, 'MMMM yyyy'),
              }}
              mode="single"
            />

            {displayedSchedules && isDoctor ? (
              <Schedules
                schedules={displayedSchedules}
                isOwner={isOwner}
                isDoctor={isDoctor && true}
                username={user.username}
              />
            ) : null}
          </section>
        </>
      ) : null}

      {isOwner ? <BookedAppointments /> : null}

      {isDoctor && user.doctor?.userId ? (
        <>
          <Spacer variant="lg" />
          <hr className="border-t border-gray-200 dark:border-gray-700" />
          <Spacer variant="sm" />
          <Reviews
            reviews={user.doctor?.reviews}
            doctorId={user.doctor?.userId}
            userId={loggedInUserId}
            totalReviews={user.doctor?._count?.reviews}
            overallRating={overallRating}
          />
        </>
      ) : null}
      <Spacer variant="lg" />
    </main>
  )
}

export function ErrorBoundary() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center p-20">
      <PageTitle>404</PageTitle>
      <p className="text-center text-4xl font-bold">User not found</p>
      <Link to="/search" className="text-center text-lg underline">
        Go back
      </Link>
    </div>
  )
}

const Schedules = ({
  schedules,
  isDoctor,
  isOwner,
  username,
}: ScheduleProps) => {
  return (
    <div className="col-span-1 lg:col-span-3">
      {schedules && schedules?.length > 0 && (
        <div className="relative flex items-center">
          <span className="h-0.5 w-full border"></span>
          <h5 className="mx-1 text-nowrap text-4xl font-bold text-secondary-foreground">
            {format(schedules[0].date ?? new Date(), 'dd MMMM, yyyy')}
          </h5>
          <span className="h-0.5 w-full border"></span>
        </div>
      )}
      <Spacer variant="sm" />

      {schedules && schedules?.length === 0 ? (
        <p className="text-lg text-accent-foreground">No available schedules</p>
      ) : null}

      <ul className="max-h-[40rem] space-y-4 overflow-y-auto">
        {schedules?.map(schedule => (
          <ScheduleItem
            key={schedule.id}
            schedule={schedule}
            isDoctor={isDoctor}
            isOwner={isOwner}
            username={username}
          />
        ))}
      </ul>
      {isDoctor && isOwner ? (
        <div className="flex items-center">
          <Button asChild variant="default" className="mt-6">
            <Link to="/add/schedule">Create a new schedule plan</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}

const Reviews = ({
  reviews,
  doctorId,
  userId,
  totalReviews,
  overallRating,
}: ReviewProps) => {
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ReviewSchema })
    },
    shouldRevalidate: 'onSubmit',
  })
  if (!reviews) return null

  return (
    <section>
      <h4 className="text-sm font-extrabold">RATINGS AND REVIEWS</h4>

      <div>
        <p className="flex items-center gap-2 text-6xl font-extrabold">
          {overallRating || 0}
          <span>
            <StarIcon className="h-6 w-6 fill-cyan-400 stroke-cyan-400" />
          </span>
        </p>

        <p className="mt-1 text-sm">
          &#40;
          {totalReviews} {Number(totalReviews) > 1 ? 'Ratings' : 'Rating'}&#41;
        </p>
      </div>

      <Spacer variant="md" />

      <h6 className="text-sm font-extrabold uppercase text-secondary-foreground">
        Reviews
      </h6>
      <ul className="max-w-4xl py-2">
        {reviews.map(review => (
          <li
            key={review.id}
            className="flex items-start gap-4 border-b py-6 first:pt-0"
          >
            <div className="flex-1 space-y-4">
              <div className="flex gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i}>
                    <StarIcon
                      className={`h-5 w-5 ${review.rating > i && 'fill-cyan-400'} stroke-cyan-400`}
                    />
                  </span>
                ))}
              </div>
              <p className="font-montserrat text-xs font-semibold text-secondary-foreground">
                {review.user.fullName || review.user.username}
                <span className="ml-2 text-[11px] font-medium text-muted-foreground">
                  {review.createdAt}
                </span>
              </p>

              <p className="text-sm text-secondary-foreground">
                {review.comment}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Spacer variant="md" />
      <div className="flex max-w-4xl items-center justify-center">
        <Button asChild variant="default">
          <Link to="/reviews">See More</Link>
        </Button>
      </div>

      <Spacer variant="md" />
      <h6 className="text-lg font-extrabold uppercase text-secondary-foreground">
        Write a Review
      </h6>
      <Spacer variant="sm" />
      <Form method="post" {...getFormProps(form)}>
        <input
          {...getInputProps(fields.doctorId, { type: 'hidden' })}
          value={doctorId}
        />
        <input
          {...getInputProps(fields.userId, { type: 'hidden' })}
          value={userId}
        />
        <Label htmlFor={fields.rating.id} className="text-sm font-semibold">
          Rating
        </Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <label key={star} className="cursor-pointer">
              <input
                {...getInputProps(fields.rating, { type: 'radio' })}
                value={star}
                className="peer sr-only"
              />
              <Star
                className={`h-8 w-8 ${
                  star <= Number(fields.rating.value)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-400'
                } transition-colors duration-150`}
              />
            </label>
          ))}
        </div>
        <ErrorList errors={fields.rating.errors} />
        <Spacer variant="sm" />

        <TextareaField
          labelProps={{ htmlFor: fields.comment.id, children: 'Comment' }}
          textareaProps={{
            ...getInputProps(fields.comment, { type: 'text' }),
            autoComplete: 'off',
            rows: 4,
          }}
          errors={fields.comment.errors}
        />
        <Button type="submit" name="_action" value="create-review">
          Submit
        </Button>
      </Form>
    </section>
  )
}

const BookedAppointments = () => {
  const { user } = useLoaderData<typeof loader>()
  const bookings = user.bookings
  const getAmount = (fee: number | null) => Number(fee) || 0
  function totalCost(
    serialFee: number | null,
    visitFee: number | null,
    discountFee: number | null,
  ) {
    return (
      getAmount(serialFee) + getAmount(visitFee) + getAmount(discountFee) || 0
    )
  }

  return (
    <section className="mx-auto w-full">
      <Spacer variant="lg" />
      <SectionTitle>Booked Appointments</SectionTitle>

      <Spacer variant="sm" />

      {bookings.length === 0 ? (
        <p className="text-lg text-accent-foreground">
          Looks like you haven&apos;t booked any appointments yet.{' '}
          <Link
            to="/search"
            className="text-center text-lg text-brand underline"
          >
            Book now!
          </Link>
        </p>
      ) : null}

      <div className="space-y-8">
        {bookings.map(booking => {
          const isInThePast = isPast(new Date(booking.schedule.date))
          return (
            <div key={booking.id} className="relative">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-16 w-16 border">
                    {booking.doctor.image ? (
                      <img
                        className="h-16 w-16 rounded-full"
                        src={booking.doctor.image}
                        alt={
                          booking.doctor.user.fullName ||
                          booking.doctor.user.username
                        }
                      />
                    ) : (
                      <UserIcon className="h-8 w-8" />
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <Link
                      to={`/profile/${booking.doctor.user.username}`}
                      className="hover:text-cyan-400 hover:underline"
                    >
                      <CardTitle>
                        {booking.doctor.user.fullName ||
                          booking.doctor.user.username}
                      </CardTitle>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Appointment on{' '}
                      {format(new Date(booking.schedule.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  {isInThePast ? (
                    <Button asChild variant="outline">
                      <Link
                        to={`/profile/${booking.doctor.user.username}`}
                        className="flex w-max items-center gap-2 text-sm text-accent-foreground"
                      >
                        Leave a Review
                      </Link>
                    </Button>
                  ) : null}
                  {!isInThePast &&
                  !isScheduleInSixHours(
                    booking.schedule.date,
                    booking.schedule.startTime,
                  ) ? (
                    <CancelBookingButton bookingId={booking.id} />
                  ) : null}
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <strong>Schedule Date: </strong>
                        {format(
                          new Date(booking.schedule.date),
                          'EEEE, MMMM d, yyyy',
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <strong>Schedule Time: </strong>
                        {formatTime(booking.schedule.startTime)} -{' '}
                        {formatTime(booking.schedule.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <strong>Location: </strong>
                        {booking.schedule.location.name},{' '}
                        {booking.schedule.location.address},{' '}
                        {booking.schedule.location.city},{' '}
                        {booking.schedule.location.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <strong>Total Cost: </strong>
                        {totalCost(
                          booking.schedule.serialFee,
                          booking.schedule.visitFee,
                          booking.schedule.discountFee,
                        )}
                        tk
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <strong>Paid Amount: </strong>
                        {booking.schedule.depositAmount || 0}tk tk
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Booked on{' '}
                        <strong className="underline">
                          {format(
                            new Date(booking.schedule.createdAt),
                            'MMMM d, yyyy',
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const ScheduleItem = ({
  schedule,
  isOwner,
  isDoctor,
  username,
}: {
  schedule: TSchedule
  isOwner: boolean
  isDoctor: boolean
  username: string
}) => {
  const deleteFetcher = useFetcher()
  const actionData = useActionData<typeof action>()
  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ScheduleDeleteSchema })
    },
    shouldRevalidate: 'onSubmit',
  })
  const isDeleting = deleteFetcher.formData?.get('scheduleId') === schedule.id
  return (
    <li
      hidden={isDeleting}
      className="flex items-center rounded-md border transition-all"
    >
      <div className="h-full w-full px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2">
            <MapPin className="h-8 w-8" />
            <div>
              <h6 className="flex items-end text-2xl font-bold leading-none">
                {schedule.location.name}
                <span className="text-xs font-normal">
                  /{formatTime(schedule.startTime)} -{' '}
                  {formatTime(schedule.endTime)}
                </span>
              </h6>
              <div className="mt-2 text-sm text-accent-foreground">
                {schedule.location.address}, {schedule.location.city},{' '}
                {schedule.location.state}, {schedule.location.zip}
              </div>
              <div className="mt-4">
                {!isOwner && (
                  <Link
                    to={`/profile/${username}/schedule/${schedule.id}`}
                    className="flex w-max items-start rounded-md bg-amber-300 px-2 py-1 text-secondary"
                  >
                    Book Now
                  </Link>
                )}
                {isOwner && isDoctor && (
                  <div className="space-y-2">
                    <div className="flex gap-2 text-sm">
                      <button className="flex w-max items-start rounded-md border border-secondary-foreground bg-secondary px-2 py-1 text-secondary-foreground">
                        <Link to={`/edit/schedule/${schedule.id}`}>
                          Edit Schedule
                        </Link>
                      </button>
                      <deleteFetcher.Form method="POST" {...getFormProps(form)}>
                        <input
                          {...getInputProps(fields.scheduleId, {
                            type: 'hidden',
                          })}
                          value={schedule.id}
                        />
                        <ErrorList errors={fields.scheduleId.errors} />
                        <button
                          name="_action"
                          value="delete-schedule"
                          type="submit"
                          className="flex w-max items-start rounded-md border border-destructive bg-destructive px-2 py-1 text-destructive-foreground transition-all"
                        >
                          Remove Schedule
                        </button>
                      </deleteFetcher.Form>
                    </div>
                    <ErrorList errors={form.errors} />

                    <p>Bookings: {schedule._count?.bookings}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="font-bold text-accent-foreground">
              Visit Fee: {schedule.visitFee}tk
            </div>
            <div className="text-secondary-foreground">
              Serial Fee: {schedule.serialFee}tk
            </div>
            <div className="text-sm text-secondary-foreground">
              Discount: {schedule.discountFee}tk
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const deleteFetcher = useFetcher()
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: z.object({ bookingId: z.string() }),
      })
    },
    shouldRevalidate: 'onSubmit',
  })

  return (
    <deleteFetcher.Form method="POST" {...getFormProps(form)}>
      <input
        {...getInputProps(fields.bookingId, { type: 'hidden' })}
        value={bookingId}
      />
      <button
        name="_action"
        value="cancel-booking"
        type="submit"
        className="flex w-max items-start rounded-md border border-destructive bg-destructive px-2 py-1 text-destructive-foreground transition-all"
      >
        Cancel Booking
      </button>
    </deleteFetcher.Form>
  )
}
