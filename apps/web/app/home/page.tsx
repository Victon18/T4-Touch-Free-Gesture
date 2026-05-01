import type { Metadata } from 'next';
import Hero from "@/components/Hero";
import UseCases from "@/components/UseCases";
import HowItWorks from "@/components/HowItWorks";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: 'Gestura | Control Everything. Touch Nothing.',
  description: 'One AI-powered app that turns your hand gestures into actions. Touch-free control for media, slides, smart home, accessibility, and beyond.',
  keywords: ['gesture control', 'AI hand tracking', 'hands-free', 'accessibility', 'smart home gestures', 'webcam hand tracking'],
};

export default function Home() {
  return (
    <div className="w-full bg-black min-h-screen text-white font-sans selection:bg-cyan-500/30">
      <main className="flex flex-col items-center justify-center w-full">
        <Hero />
        <UseCases />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
