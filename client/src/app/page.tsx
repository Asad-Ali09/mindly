'use client'

import MinimalHero from '@/components/ui/hero-minimalism'
import QuoteSection from '@/components/ui/quote-section'
import { Card } from '@/components/ui/card'
import { Features } from '@/components/ui/features'
import BentoCards from '@/components/ui/bento-cards'
import CaseStudies from '@/components/ui/case-studies'
import { CallToAction } from '@/components/ui/cta-3'
import { MinimalFooter } from '@/components/ui/minimal-footer'
import { AnimatedGroup } from '@/components/ui/animated-group'

// Reusable Section Header Component
interface SectionHeaderProps {
  title: string
  description: string
}

function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 text-center max-w-3xl mx-auto mb-16">
      <AnimatedGroup
        variants={{
          container: {
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          },
          item: {
            hidden: {
              opacity: 0,
              filter: 'blur(12px)',
              y: 12,
            },
            visible: {
              opacity: 1,
              filter: 'blur(0px)',
              y: 0,
              transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
              },
            },
          },
        }}
      >
        <div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight">
            {title}
          </h2>
        </div>
      </AnimatedGroup>
      <p className="text-lg md:text-xl text-white/70 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

// Reusable Section Container Component
interface SectionProps {
  children: React.ReactNode
  className?: string
  withContainer?: boolean
}

function Section({ children, className = '', withContainer = true }: SectionProps) {
  const baseClasses = 'relative bg-darker'
  const fullClasses = className ? `${baseClasses} ${className}` : baseClasses

  if (!withContainer) {
    return <section className={fullClasses}>{children}</section>
  }

  return (
    <section className={fullClasses}>
      <div className="container mx-auto px-6 lg:px-8">{children}</div>
    </section>
  )
}

// Problem Cards Data
const problemCardsData = [
  {
    title: 'One Size Fits   All Learning',
    description: 'Every learner is unique, but traditional lessons treat everyone the same. Without personalized pacing or adaptive content, students either fall behind or lose interest.',
  },
  {
    title: 'Passive, Not Interactive',
    description: 'Watching videos or reading static notes doesn\'t promote active understanding. Learners can\'t ask questions in real time or clarify concepts when confusion strikes.',
  },
  {
    title: 'Lack of Real-Time Support',
    description: 'In conventional systems, feedback is delayed — sometimes days or weeks later. Without immediate guidance, mistakes compound and confidence declines.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-darker">
      {/* Hero Section */}
      <MinimalHero />

      {/* The Problem Section */}
      <Section className="py-20 md:py-28 lg:py-32">
        <SectionHeader
          title="The Problem"
          description="Traditional learning methods are outdated, inefficient, and disconnected from how people actually learn today."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {problemCardsData.map((problem) => (
            <Card
              key={problem.title}
              variant="dots"
              title={problem.title}
              description={problem.description}
              className="bg-darker border-rust/40 h-full"
            />
          ))}
        </div>
      </Section>

      {/* Our Vision Section */}
      <Section className="py-20 md:py-28 lg:py-32">
        <SectionHeader
          title="Our Vision"
          description="Transforming education through the power of artificial intelligence"
        />
        <QuoteSection />
      </Section>


      {/* Platform Features Section */}
      <Section className="py-20 md:py-28 lg:py-32">
        <SectionHeader
          title="Platform Features"
          description="Experience AI-powered education that adapts to your unique learning style"
        />
        <Features />
      </Section>

      {/* Learning Capabilities Section */}
      <Section className="py-20 md:py-28 lg:py-32">
        <SectionHeader
          title="Learning Capabilities"
          description="Explore the comprehensive features that power your learning journey"
        />
        <BentoCards />
      </Section>

      {/* Why Interactive Learning Matters Section */}
      <Section className="py-20 md:py-28 lg:py-32">
        <SectionHeader
          title="Why Interactive Learning Matters"
          description="Research shows that passive learning no longer meets the demands of today's learners. Here's why AI-powered interactive learning changes everything."
        />
        <CaseStudies />
      </Section>

      {/* Call to Action Section */}
      <Section withContainer={false}>
        <CallToAction />
      </Section>

      {/* Footer Section */}
      <Section withContainer={false}>
        <MinimalFooter />
      </Section>
    </main>
  )
} 