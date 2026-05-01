'use client';

import { motion } from 'framer-motion';
import HandAnimation from './HandAnimation';
import { ArrowRight, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
const Hero = () => {
  const router = useRouter();
return (
    <section className="relative min-h-screen w-full bg-black overflow-hidden flex items-center justify-center pb-16 pt-24">

      {/* CSS Grid background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.07) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%,#000 60%,transparent 100%)',
        }}
      />

      {/* Glowing orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px] -z-10" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[120px] -z-10" />

      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* ── Text side ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col gap-6 text-center lg:text-left"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium w-fit mx-auto lg:mx-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            Introducing Gestura AI
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Control Everything. <br className="hidden md:block" />
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg,#22d3ee,#8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Touch Nothing.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            One AI-powered app that turns your hand gestures into actions — media, slides, smart home, accessibility, and beyond.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 justify-center lg:justify-start">
            <button
              className="group relative px-8 py-4 rounded-full font-semibold text-black overflow-hidden transition-transform active:scale-95 flex items-center gap-2"
              style={{ background: 'linear-gradient(90deg,#22d3ee,#8b5cf6)' }}
    onClick={() => window.open('https://github.com/Victon18/T4-Touch-Free-Gesture', '_blank')}
            >
              <span className="flex items-center gap-2 text-white">
                Github
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button className="px-8 py-4 rounded-full text-white font-medium border border-zinc-700 hover:bg-zinc-900 transition-colors flex items-center gap-2"
    onClick={() => router.push('/control')}
>
              <Play className="w-4 h-4 fill-white" /> See It in Action
            </button>
          </div>

          {/* Social proof */}
                  </motion.div>

        {/* ── Visual side ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex items-center justify-center"
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 0 80px rgba(139,92,246,0.15)',
            }}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
              style={{ background: 'linear-gradient(90deg,#22d3ee,#8b5cf6)' }} />

            <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-xs text-zinc-500 font-mono">
              <span>STATUS: TRACKING</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" /> LIVE
              </span>
            </div>

            <HandAnimation />

            {/* Detected gesture chip */}
            <div
              className="w-full mt-4 rounded-xl border border-white/10 p-4 flex items-center justify-between"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              <div>
                <p className="text-white text-sm font-medium">Gesture Detected</p>
                <p className="text-cyan-400 text-xs font-mono mt-1">"Swipe Right" → Next Slide</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
