"use client";


import FAQ from "@/components/FAQ";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import UseCases from "@/components/UseCases";
import Hero from "@/components/Hero";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="w-full bg-black">
      <section className="h-screen flex items-center justify-center bg-black">
        <Hero />
      </section>
      <section className="h-screen flex items-center justify-center bg-black">
          <UseCases />
      </section>
      <section className="h-screen flex items-center justify-center bg-black">
          <FAQ />
      </section>

    </div>
  );
}
