import { Link, type MetaFunction, Outlet, redirect } from '@remix-run/react'
import { Spacer } from '~/components/spacer'
import { PageTitle } from '~/components/typography'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'

export const meta: MetaFunction = () => {
  return [{ title: 'Dashboard / CH' }]
}

export default function DoctorDashboard() {
  return (
    <div className="container mx-auto space-y-6 p-4">
      <PageTitle>Dashboard</PageTitle>
      <Tabs defaultValue="overview" className="w-full border-b">
        <TabsList className="grid w-max grid-cols-3">
          <TabsTrigger value="overview" asChild>
            <Link to="/doctor/dashboard/overview">Overview</Link>
          </TabsTrigger>
          <TabsTrigger value="earnings" asChild>
            <Link to="/doctor/dashboard/earnings">Earnings</Link>
          </TabsTrigger>
          <TabsTrigger value="appointments" asChild>
            <Link to="/doctor/dashboard/appointments">Appointments</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Outlet />
    </div>
  )
}