import { Calendar, Clock, Users, CheckCircle } from 'lucide-react'
import { Link, MetaFunction } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Spacer } from '~/components/spacer'

export const meta: MetaFunction = () => {
  return [{ title: 'Doctor / CH' }]
}

export default function BecomeDoctor() {
  return (
    <>
      <Spacer variant="lg" />
      <div className="container space-y-12">
        <div>
          <h1 className="max-w-4xl text-4xl font-extrabold md:text-7xl">
            Start getting appointments from CareHub
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Streamline your practice, reach more patients, and provide better
            care with our innovative healthcare platform.
          </p>
        </div>
        <Button size="lg" asChild className="font-bold">
          <Link to="/doctor/onboarding">Get Started</Link>
        </Button>

        <p className="text-muted-foreground">
          <span className="font-extrabold">C</span>reate your profile and start
          getting appointments from CareHub.
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Clock className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Flexible Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              Create custom schedules for multiple locations. Set your
              availability and let patients book appointments that fit your
              calendar.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Expand Your Patient Base</CardTitle>
            </CardHeader>
            <CardContent>
              Reach more patients through our platform. Increase visibility and
              grow your practice with ease.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Calendar className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Efficient Practice Management</CardTitle>
            </CardHeader>
            <CardContent>
              Manage appointments, patient records, and schedules all in one
              place. Spend less time on admin and more time on patient care.
            </CardContent>
          </Card>
        </div>

        <div className="mb-12 text-center">
          <Button size="lg" asChild className="font-bold">
            <Link to="/doctor/onboarding">Get Started</Link>
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-8">
          <h2 className="mb-4 text-2xl font-bold">How It Works</h2>
          <ol className="space-y-4">
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-6 w-6 flex-shrink-0 text-primary" />
              <span>
                <strong>Create Your Profile:</strong> Sign up and complete your
                professional profile with your specialties, qualifications, and
                a brief bio.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-6 w-6 flex-shrink-0 text-primary" />
              <span>
                <strong>Set Your Schedule:</strong> Define your availability for
                each location where you practice. You can create multiple
                schedules for different days and locations.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-6 w-6 flex-shrink-0 text-primary" />
              <span>
                <strong>Manage Appointments:</strong> Patients can book
                appointments based on your availability. You&apos;ll receive
                notifications and can manage all appointments through the
                platform.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-6 w-6 flex-shrink-0 text-primary" />
              <span>
                <strong>Provide Care:</strong> Use the platform to access
                patient information, update records, and ensure continuity of
                care across all your practice locations.
              </span>
            </li>
          </ol>
        </div>
      </div>
      <Spacer variant="lg" />
    </>
  )
}
