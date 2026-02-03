'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs: FAQItem[] = [
    {
      question: 'What is a Color Run?',
      answer:
        'A Color Run is a fun, non-competitive running event where participants are doused with safe, eco-friendly colored powder at various stations throughout the course. It\'s all about having fun, being active, and celebrating together!',
    },
    {
      question: 'Is the colored powder safe?',
      answer:
        'Yes! We use 100% safe, non-toxic, and eco-friendly colored powder made from cornstarch and food-grade dyes. It\'s completely safe for your skin, eyes, and the environment.',
    },
    {
      question: 'What should I wear?',
      answer:
        'Wear white or light-colored clothing to show off the colors! We recommend comfortable running clothes and closed-toe shoes. You\'ll receive an event t-shirt with your ticket.',
    },
    {
      question: 'Do I need to be a runner to participate?',
      answer:
        'Not at all! The Color Run is for everyone - walkers, joggers, and runners of all fitness levels. You can walk the entire course if you prefer. It\'s about having fun, not speed!',
    },
    {
      question: 'Can children participate?',
      answer:
        'Yes! Children are welcome to participate. Children under 12 must be accompanied by an adult. Please note that strollers are allowed on the course.',
    },
    {
      question: 'What happens if it rains?',
      answer:
        'The event will proceed rain or shine! In case of severe weather conditions, we will notify all participants via email and social media with updates.',
    },
    {
      question: 'Can I get a refund?',
      answer:
        'Tickets are non-refundable but may be transferable to another person. Please contact us at info@jcimanilacolorrun.com for transfer requests at least 7 days before the event.',
    },
    {
      question: 'Where do the proceeds go?',
      answer:
        'All proceeds from the JCI Manila Color Run support mental health awareness initiatives and programs in the Philippines. Your participation directly contributes to important mental health causes.',
    },
  ]

  return (
    <section id="faq" className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-pink mx-auto"></div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-primary-500 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

