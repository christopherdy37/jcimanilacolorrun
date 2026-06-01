import Image from 'next/image'

export default function ComingSoon() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Blurred poster background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/hero/jci_poster.png)',
          filter: 'blur(48px)',
          transform: 'scale(1.12)',
          opacity: 0.6,
        }}
        aria-hidden
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" aria-hidden />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-2xl mx-auto">
        {/* Poster thumbnail */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-8 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
          <Image
            src="/images/hero/jci_poster.png"
            alt="JCI Manila Colorfest Carnival Run"
            fill
            className="object-cover object-top"
            priority
          />
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
          See You Next Year!
        </h1>

        {/* Color bar */}
        <div className="flex gap-2 mb-6">
          {['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-500', 'bg-purple-500'].map((c) => (
            <div key={c} className={`${c} w-8 h-2 rounded-full`} />
          ))}
        </div>

        <p className="text-xl sm:text-2xl font-semibold text-white/90 mb-3">
          JCI Manila Colorfest Carnival Run
        </p>

        <p className="text-base sm:text-lg text-white/70 mb-10 max-w-md leading-relaxed">
          Thank you to everyone who joined us! The event was a huge success.
          We&apos;ll be back with more color, more fun, and more memories.
          Stay tuned for next year&apos;s run!
        </p>

        {/* CTA */}
        <a
          href="mailto:jcimanilacolorrun@gmail.com"
          className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold px-8 py-4 rounded-full text-base sm:text-lg shadow-xl hover:from-red-400 hover:to-orange-400 hover:scale-105 transition-all"
        >
          Get Notified for 2027
        </a>

        <p className="mt-8 text-white/40 text-sm">
          © {new Date().getFullYear()} JCI Manila &nbsp;·&nbsp; All rights reserved
        </p>
      </div>
    </main>
  )
}
