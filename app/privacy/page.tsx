import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="prose max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
            <p>
              When you purchase tickets or interact with our website, we collect the following information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email address, and phone number</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Emergency contact information</li>
              <li>Shirt size and other event-related preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process your ticket purchase and manage your order</li>
              <li>Send you order confirmations and event updates</li>
              <li>Contact you in case of event changes or emergencies</li>
              <li>Improve our services and website experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information.
              Payment information is processed securely through Stripe and is not stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Third-Party Services</h2>
            <p>
              We use third-party services for payment processing (Stripe) and email delivery. These
              services have their own privacy policies and handle your data according to their terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information. To exercise
              these rights, please contact us at info@jcimanilacolorrun.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              Email: info@jcimanilacolorrun.com
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

