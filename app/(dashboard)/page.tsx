import { Collections } from '@/components/landing/collections';
import { FAQ } from '@/components/landing/faq';
import { FinalCTA } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';
import { Features } from '@/components/landing/features';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { PricingSection } from '@/components/landing/pricing-section';
import { UseCases } from '@/components/landing/use-cases';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Collections />
      <Features />
      <HowItWorks />
      <UseCases />
      <PricingSection />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
