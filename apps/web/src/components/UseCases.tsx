'use client';

import { motion, Variants } from 'framer-motion';
import { Music, MonitorPlay, Home, HeartHandshake, MousePointerClick, Settings2 } from 'lucide-react';

const useCases = [
  {
    title: 'Media Control',
    description: 'Play, pause, skip, and control volume with a simple wave. No need to reach for the keyboard.',
    icon: <Music className="w-6 h-6" style={{ color: '#22d3ee' }} />,
    accent: '#22d3ee',
  },
  {
    title: 'Presentation Control',
    description: 'Navigate slides hands-free during demos and pitches. Look like a wizard in your next meeting.',
    icon: <MonitorPlay className="w-6 h-6" style={{ color: '#8b5cf6' }} />,
    accent: '#8b5cf6',
  },
  {
    title: 'Smart Home Gestures',
    description: 'Trigger lights, fans, or custom scenes with a gesture. Integrate with your favourite smart home hubs.',
    icon: <Home className="w-6 h-6" style={{ color: '#22d3ee' }} />,
    accent: '#22d3ee',
  },
  {
    title: 'Accessibility Mode',
    description: 'Assistive gesture controls designed for mobility-impaired users to interact seamlessly with their devices.',
    icon: <HeartHandshake className="w-6 h-6" style={{ color: '#8b5cf6' }} />,
    accent: '#8b5cf6',
  },
  {
    title: 'In-App Navigation',
    description: 'Scroll, click, and navigate your PC or specific apps entirely without a physical mouse.',
    icon: <MousePointerClick className="w-6 h-6" style={{ color: '#22d3ee' }} />,
    accent: '#22d3ee',
  },
  {
    title: 'Custom Gesture Mapping',
    description: 'Define your own unique gestures and bind them to any system shortcut or application action.',
    icon: <Settings2 className="w-6 h-6" style={{ color: '#8b5cf6' }} />,
    accent: '#8b5cf6',
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

export default function UseCases() {
  return (
    <section id="features" className="w-full py-24 bg-black relative overflow-hidden">
      {/* faint grid */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.05) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%,#000 60%,transparent 100%)',
        }}
      />

      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Endless{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg,#22d3ee,#8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Possibilities
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg"
          >
            Discover how touch-free interactions can transform your daily workflows and environment.
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {useCases.map((uc, idx) => (
            <motion.div
              key={idx}
              variants={item}
              className="group relative p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {/* icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {uc.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{uc.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{uc.description}</p>

              {/* bottom glow on hover */}
              <div
                className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg,transparent,${uc.accent},transparent)` }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
