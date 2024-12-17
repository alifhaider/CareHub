import { Calendar, Clock, DollarSign, Users } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export default function DoctorDashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +20% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              2 more than yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Consultation Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25 min</div>
            <p className="text-xs text-muted-foreground">
              -2 min from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month&apos;s Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                { time: '10:00 AM', patient: 'John Doe' },
                { time: '11:30 AM', patient: 'Jane Smith' },
                { time: '2:00 PM', patient: 'Alice Johnson' },
              ].map((appointment, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span>{appointment.time}</span>
                  <span>{appointment.patient}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full">View All Appointments</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                'Updated patient records for Emily Brown',
                'Completed consultation with Michael Wilson',
                'Reviewed lab results for Sarah Davis',
                'Scheduled follow-up appointment with Chris Taylor',
              ].map((activity, index) => (
                <li key={index} className="text-sm">
                  {activity}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-4 w-full">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
