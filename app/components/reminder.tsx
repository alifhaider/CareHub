export default function Reminder() {
  return (
    <section className="bg-primary-foreground">
      <div className="container mx-auto border-b p-10">
        <h2 className="mb-4 text-lg font-semibold text-primary">Reminders</h2>
        <div className="max-w-4xl space-y-4 text-sm">
          <p>
            * When booking an appointment, please have your medical history,
            current medications, and insurance information ready. Arrive 15
            minutes early for your first visit.
          </p>

          <p>
            * If you need to cancel or reschedule your appointment, please do so
            at least 24 hours in advance.
          </p>

          <p>
            * If you have any questions or need assistance, please contact us at{' '}
            <a
              href="mailto:support@carehub.com"
              className="text-cyan-400 underline"
            >
              support@carehub.com
            </a>
            .
          </p>

          <p>
            * CareHub is not a healthcare provider. We are a platform that helps
            you find and book appointments with healthcare providers.
          </p>

          <p>
            * If you are experiencing a medical emergency, call 911 or visit the
            nearest emergency room.
          </p>

          <p>
            * CareHub is a registered trademark of CareHub, Inc. All rights
            reserved.
          </p>
        </div>
      </div>
    </section>
  )
}
