import { Search } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

export default function DoctorAppointmentsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appointment Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar mode="single" className="rounded-md border" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                { time: '09:00 AM', patient: 'John Doe', type: 'Check-up' },
                { time: '10:30 AM', patient: 'Jane Smith', type: 'Follow-up' },
                {
                  time: '02:00 PM',
                  patient: 'Alice Johnson',
                  type: 'Consultation',
                },
                { time: '03:30 PM', patient: 'Bob Brown', type: 'Check-up' },
              ].map((appointment, index) => (
                <li key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{appointment.time}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.patient}
                    </p>
                  </div>
                  <span className="text-sm">{appointment.type}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patient-search">Find Patient</Label>
              <div className="mt-1.5 flex">
                <Input id="patient-search" placeholder="Search patients..." />
                <Button type="submit" size="icon" className="ml-2">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full">Schedule New Appointment</Button>
            <Button variant="outline" className="w-full">
              View All Appointments
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {[
              {
                date: 'Tomorrow',
                appointments: [
                  {
                    time: '09:30 AM',
                    patient: 'Emily White',
                    type: 'Check-up',
                  },
                  {
                    time: '11:00 AM',
                    patient: 'Michael Black',
                    type: 'Follow-up',
                  },
                ],
              },
              {
                date: 'Next Week',
                appointments: [
                  {
                    time: 'Monday, 10:00 AM',
                    patient: 'Sarah Green',
                    type: 'Consultation',
                  },
                  {
                    time: 'Wednesday, 02:30 PM',
                    patient: 'David Blue',
                    type: 'Check-up',
                  },
                ],
              },
            ].map((day, dayIndex) => (
              <li key={dayIndex}>
                <h3 className="mb-2 font-semibold">{day.date}</h3>
                <ul className="space-y-2">
                  {day.appointments.map((appointment, appointmentIndex) => (
                    <li
                      key={appointmentIndex}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{appointment.time}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.patient}
                        </p>
                      </div>
                      <span className="text-sm">{appointment.type}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
