'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import CheckoutModal from './CheckoutModal'

interface TicketType {
  id: string
  name: string
  description: string | null
  price: number
  maxQuantity: number | null
  isActive: boolean
}

export default function TicketSection() {
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderingEnabled, setOrderingEnabled] = useState(false)

  useEffect(() => {
    fetch('/api/ordering-status')
      .then((res) => res.json())
      .then((data) => setOrderingEnabled(data.ticketOrderingEnabled === true))
      .catch(() => setOrderingEnabled(false))
  }, [])

  useEffect(() => {
    fetch('/api/tickets')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch tickets')
        }
        return res.json()
      })
      .then((data) => {
        // Ensure data is always an array
        if (Array.isArray(data)) {
          setTickets(data)
        } else {
          console.error('Invalid data format:', data)
          setTickets([])
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching tickets:', error)
        setTickets([])
        setLoading(false)
      })
  }, [])

  const handleBuyTicket = (ticket: TicketType) => {
    if (!orderingEnabled) return
    setSelectedTicket(ticket)
    setShowCheckout(true)
  }

  return (
    <>
      <section id="tickets" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get Your Tickets
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-pink mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Premium ticket includes a race bib, color packets, event t-shirt, and finisher medal.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {Array.isArray(tickets) && tickets.length > 0 ? (
                tickets.map((ticket) => {
                const isPremium = ticket.name.toLowerCase().includes('premium')
                return (
                  <div key={ticket.id}>
                    {isPremium ? (
                      <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-5xl mx-auto">
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:border-primary-300 transition-all transform hover:scale-105 md:w-1/2 w-full max-w-md">
                          <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{ticket.name}</h3>
                            {ticket.description && (
                              <p className="text-gray-600 text-sm">{ticket.description}</p>
                            )}
                          </div>

                          <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-primary-600 mb-2">
                              {formatCurrency(ticket.price)}
                            </div>
                            <p className="text-sm text-gray-500">per ticket</p>
                          </div>

                          <div className="mb-6 space-y-2">
                            <div className="flex items-center text-sm text-gray-700">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Race Bib & Timing Chip
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Color Packets
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Event T-Shirt
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Finisher Medal
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleBuyTicket(ticket)}
                            disabled={!orderingEnabled}
                            className={`w-full py-3 rounded-lg font-semibold transition-all shadow-lg ${
                              orderingEnabled
                                ? 'bg-gradient-to-r from-primary-500 to-accent-pink text-white hover:from-primary-600 hover:to-accent-pink/90 cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {orderingEnabled ? 'Buy Tickets' : 'Temporarily unavailable'}
                          </button>
                        </div>
                        <div className="md:w-1/2 w-full flex justify-center">
                          <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                            <Image
                              src="/images/hero/jci_cr_ticket.jpg"
                              alt="JCI Manila Color Run Ticket"
                              fill
                              className="object-contain"
                              priority
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:border-primary-300 transition-all transform hover:scale-105 w-full max-w-md">
                          <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{ticket.name}</h3>
                            {ticket.description && (
                              <p className="text-gray-600 text-sm">{ticket.description}</p>
                            )}
                          </div>

                          <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-primary-600 mb-2">
                              {formatCurrency(ticket.price)}
                            </div>
                            <p className="text-sm text-gray-500">per ticket</p>
                          </div>

                          <div className="mb-6 space-y-2">
                            <div className="flex items-center text-sm text-gray-700">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Race Bib & Timing Chip
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Color Packets
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Event T-Shirt
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Finisher Medal
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleBuyTicket(ticket)}
                            disabled={!orderingEnabled}
                            className={`w-full py-3 rounded-lg font-semibold transition-all shadow-lg ${
                              orderingEnabled
                                ? 'bg-gradient-to-r from-primary-500 to-accent-pink text-white hover:from-primary-600 hover:to-accent-pink/90 cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {orderingEnabled ? 'Buy Tickets' : 'Temporarily unavailable'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No tickets available at this time.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {showCheckout && selectedTicket && (
        <CheckoutModal
          ticket={selectedTicket}
          onClose={() => {
            setShowCheckout(false)
            setSelectedTicket(null)
          }}
        />
      )}
    </>
  )
}

