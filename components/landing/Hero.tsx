'use client'

import { useEffect, useState } from 'react'

export default function Hero() {
  const [orderingEnabled, setOrderingEnabled] = useState(false)

  useEffect(() => {
    fetch('/api/ordering-status')
      .then((res) => res.json())
      .then((data) => setOrderingEnabled(data.ticketOrderingEnabled === true))
      .catch(() => setOrderingEnabled(false))
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-accent-pink to-accent-blue overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Animated color particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-pulse"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              backgroundColor: ['#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#a78bfa'][
                Math.floor(Math.random() * 5)
              ],
              animationDelay: Math.random() * 2 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-4 py-20 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
          JCI Manila Color Run
        </h1>
        <p className="text-2xl md:text-3xl text-white/90 mb-8 font-semibold">
          Color Run for Mental Health
        </p>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 mb-8 border border-white/20">
          <div className="grid md:grid-cols-2 gap-4 text-white">
            <div>
              <p className="text-sm opacity-80 mb-1">Date</p>
              <p className="text-lg font-semibold">May 31, 2026</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">Venue</p>
              <p className="text-lg font-semibold">SM Mall of Asia, Pasay City</p>
            </div>
          </div>
        </div>

        {orderingEnabled ? (
          <a
            href="#tickets"
            className="inline-block bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-red-700 transition-all transform hover:scale-105 shadow-xl"
          >
            Buy Tickets Now
          </a>
        ) : (
          <span
            className="inline-block bg-gray-400 text-white px-8 py-4 rounded-full font-bold text-lg cursor-not-allowed shadow-xl"
            aria-label="Ticket ordering temporarily unavailable"
          >
            Tickets coming soon
          </span>
        )}
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  )
}

