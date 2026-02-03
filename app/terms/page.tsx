import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms & Conditions</h1>
        
        <div className="prose max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Event Participation</h2>
            <p>
              By purchasing a ticket and participating in the JCI Manila Color Run, you agree to follow
              all event rules and regulations. Participants must be in good health and physically capable
              of completing the run.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Ticket Sales</h2>
            <p>
              All ticket sales are final. Tickets are non-refundable but may be transferable to another
              person with prior notice at least 7 days before the event. Contact us at info@jcimanilacolorrun.com
              for transfer requests.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Safety & Liability</h2>
            <p>
              Participants acknowledge that running and physical activity involve inherent risks. JCI Manila
              and event organizers are not liable for any injuries, accidents, or health issues that may
              occur during the event. Participants participate at their own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Weather & Cancellation</h2>
            <p>
              The event will proceed rain or shine. In case of severe weather or unforeseen circumstances,
              the organizers reserve the right to modify, postpone, or cancel the event. In case of cancellation,
              tickets may be transferred to a rescheduled date or refunded at the organizers' discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Photography & Media</h2>
            <p>
              By participating, you consent to being photographed and videotaped. JCI Manila reserves the right
              to use any media captured during the event for promotional and marketing purposes.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

