'use client'

import Image from 'next/image'

// All sponsor images from public/images/sponsors – images only, no text or boxes
const SPONSOR_IMAGES = [
  '/images/sponsors/sponsor1.jpeg',
  '/images/sponsors/sponsor2.jpeg',
  '/images/sponsors/sponsor3.jpeg',
  '/images/sponsors/sponsor4.jpeg',
  '/images/sponsors/sponsor5.jpeg',
  '/images/sponsors/sponsor6.jpeg',
  '/images/sponsors/sponsor7.jpg',
  '/images/sponsors/sponsor8.jpeg',
  '/images/sponsors/sponsor9.jpeg',
]

export default function Sponsors() {
  return (
    <section id="sponsors" className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Sponsors
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-pink mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Thank you to our amazing sponsors who make this event possible!
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8 items-center justify-items-center">
          {SPONSOR_IMAGES.map((src, index) => (
            <div key={index} className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
              <Image
                src={src}
                alt={`Sponsor ${index + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 128px, 160px"
              />
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

