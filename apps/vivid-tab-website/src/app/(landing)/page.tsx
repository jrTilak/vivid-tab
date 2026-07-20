import React from 'react'
import HeroSection from './_components/hero-section'
import Features from './_components/features'
import FAQs from './_components/faq'
import Highlights from './_components/highlights'

const LandingPage = () => {
  return (
    <main className='space-y-32'>
      <HeroSection />
      <Highlights />
      <Features />
      <FAQs />
    </main>
  )
}

export default LandingPage