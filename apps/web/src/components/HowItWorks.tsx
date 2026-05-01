'use client';

import { motion } from 'framer-motion';
import { Camera, Settings2, Sparkles } from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Allow Camera Access',
    description: 'Open the app and securely grant webcam access. All AI processing happens locally on your device.',
    icon: <Camera className="w-8 h-8" style={{ color: '#22d3ee' }} />,
  },
  {
    num: '02',
    title: 'Choose or Build',
    description: 'Pick a ready-made use case like Media Control, or train the app with your own custom gestures.',
    icon: <Settings2 className="w-8 h-8" style={{ color: '#8b5cf6' }} />,
  },
  {
    num: '03',
    title: 'Start Controlling',
    description: 'Wave, pinch, or swipe. Experience seamless, hands-free control instantly.',
    icon: <Sparkles className="w-8 h-8" style={{ color: '#22d3ee' }} />,
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full py-24 bg-black relative border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            How It{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg,#22d3ee,#8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Works
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg"
          >
            Three simple steps to unlock the future of human-computer interaction.
          </motion.p>
        </div>

        <div className="relative">
          {/* connecting line */}
          <div
            className="hidden md:block absolute top-10 left-0 w-full h-px -z-0"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.4),transparent)' }}
          />

          <div className="grid md:grid-cols-3 gap-12 md:gap-6 relative z-10">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.55, delay: idx * 0.18 }}
                className="flex flex-col items-center text-center group"
              >
                {/* icon box */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative border border-white/10 group-hover:border-violet-500/50 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  {step.icon}
                  <span
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-zinc-400 border border-white/10"
                    style={{ background: '#000' }}
                  >
                    {step.num}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-zinc-400 px-4">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
