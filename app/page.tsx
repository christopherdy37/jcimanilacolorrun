import Hero from '@/components/landing/Hero'
import EventDetails from '@/components/landing/EventDetails'
import TicketSection from '@/components/landing/TicketSection'
import Schedule from '@/components/landing/Schedule'
import Sponsors from '@/components/landing/Sponsors'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <EventDetails />
      <TicketSection />
      <Schedule />
      <Sponsors />
      <FAQ />
      <Footer />
    </main>
  )
}

