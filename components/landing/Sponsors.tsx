'use client'

export default function Sponsors() {
  // Placeholder sponsor data
  const sponsors = [
    { name: 'Sponsor 1', tier: 'platinum' },
    { name: 'Sponsor 2', tier: 'gold' },
    { name: 'Sponsor 3', tier: 'gold' },
    { name: 'Sponsor 4', tier: 'silver' },
    { name: 'Sponsor 5', tier: 'silver' },
    { name: 'Sponsor 6', tier: 'silver' },
  ]

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-gray-400 to-gray-600'
      case 'gold':
        return 'from-yellow-400 to-yellow-600'
      case 'silver':
        return 'from-gray-300 to-gray-500'
      default:
        return 'from-gray-200 to-gray-400'
    }
  }

  return (
    <section id="sponsors" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Sponsors
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-pink mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Thank you to our amazing sponsors who make this event possible!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {sponsors.map((sponsor, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center border-2 border-gray-200 hover:border-primary-300 transition-all"
            >
              <div
                className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${getTierColor(
                  sponsor.tier
                )} flex items-center justify-center text-white font-bold text-xl`}
              >
                {sponsor.name.charAt(0)}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{sponsor.name}</h3>
              <span className="text-sm text-gray-600 capitalize">{sponsor.tier} Sponsor</span>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Interested in sponsoring this event?</p>
          <a
            href="mailto:sponsors@jcimanilacolorrun.com"
            className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            Become a Sponsor
          </a>
        </div>
      </div>
    </section>
  )
}

