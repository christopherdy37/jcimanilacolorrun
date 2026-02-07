'use client'

import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Blurred poster fills viewport so letterbox areas (sides on ultrawide) show soft poster colors, not solid bars */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
        style={{
          backgroundImage: 'url(/images/hero/jci_poster.png)',
          filter: 'blur(40px)',
          transform: 'scale(1.08)',
        }}
        aria-hidden
      />
      {/* Sharp poster: full image visible, no crop */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero/jci_poster.png"
          alt="JCI Manila Colorfest Carnival Run"
          fill
          className="object-contain object-center"
          priority
          sizes="100vw"
        />
      </div>

      {/* Buy Tickets Now! — overlays the poster's "Register Now!" area */}
      <a
        href="#tickets"
        className="absolute left-1/2 top-[67%] -translate-x-1/2 -translate-y-1/2 z-10 inline-block bg-gradient-to-b from-red-500 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg sm:text-xl border-2 border-white border-dashed shadow-xl hover:from-red-400 hover:to-orange-400 hover:scale-105 transition-all whitespace-nowrap"
        aria-label="Buy tickets now"
      >
        Buy Tickets Now!
      </a>

      <a
        href="#tickets"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white drop-shadow-lg hover:text-white/90 transition-colors z-10"
        aria-label="Scroll to tickets"
      >
        <span className="text-sm font-medium">Get tickets</span>
        <svg
          className="w-6 h-6 animate-bounce"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </a>
    </section>
  )
}

