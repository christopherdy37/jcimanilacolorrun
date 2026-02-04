import Hero from '@/components/landing/Hero'
import EventDetails from '@/components/landing/EventDetails'
import TicketSection from '@/components/landing/TicketSection'
import Schedule from '@/components/landing/Schedule'
import Sponsors from '@/components/landing/Sponsors'
import PastColorRuns from '@/components/landing/PastColorRuns'
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
      <PastColorRuns />
      <FAQ />
      <Footer />
    </main>
  )
}

