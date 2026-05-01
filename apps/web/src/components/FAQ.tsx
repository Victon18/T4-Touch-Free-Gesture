'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Does it work without special hardware?',
    answer: 'Yes! Gestura runs entirely using your standard built-in or external webcam. No depth cameras, infrared sensors, or wearables are required.',
  },
  {
    question: 'Which gestures are supported out of the box?',
    answer: 'Pinch, Swipe Left/Right/Up/Down, Open Hand, Closed Fist, and Peace Sign — mapping directly to common actions like scrolling, swiping, and media control.',
  },
  {
    question: 'Can I create my own custom gestures?',
    answer: 'Absolutely. The built-in training module lets you record a new hand motion, name it, and bind it to any keyboard shortcut or system command.',
  },
  {
    question: 'How accurate is the AI gesture detection?',
    answer: 'Our optimised neural network runs at up to 60 fps, ensuring ultra-low latency and pinpoint accuracy even when your hands move quickly.',
  },
  {
    question: 'Does it work in low-light conditions?',
    answer: 'Yes, the model is trained on diverse lighting datasets. As long as the camera can reasonably capture the outline of your hand, Gestura will track reliably.',
  },
  {
    question: 'Is my camera feed stored or sent anywhere?',
    answer: 'No. Privacy is our top priority. All AI processing happens locally on your machine. Your camera feed never leaves your device.',
  },
  {
    question: 'Which platforms does it support?',
    answer: 'Currently Windows and macOS. A Linux version and mobile companions for iOS and Android are actively in development.',
  },
  {
    question: 'How is this different from built-in gesture shortcuts in Windows/Mac?',
    answer: 'Native OS shortcuts require a physical trackpad. Gestura is completely touch-free, works through the air, and supports fully customisable mappings far beyond what native OSes offer.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="w-full py-24 bg-black relative border-t border-white/5">
      {/* background glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-1/2 h-96 -z-10"
        style={{ background: 'radial-gradient(ellipse at top right,rgba(139,92,246,0.12),transparent 70%)' }}
      />

      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Frequently Asked{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg,#22d3ee,#8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Questions
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg"
          >
            Everything you need to know about Gestura and how it works.
          </motion.p>
        </div>

        <div className="max-w-3xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = open === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
                style={{
                  borderRadius: '16px',
                  border: `1px solid ${isOpen ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  background: isOpen ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.03)',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s,background 0.2s',
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: '17px',
                      color: isOpen ? '#22d3ee' : '#fff',
                      transition: 'color 0.2s',
                    }}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    style={{
                      width: '20px',
                      height: '20px',
                      color: isOpen ? '#22d3ee' : '#71717a',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s,color 0.2s',
                      flexShrink: 0,
                      marginLeft: '12px',
                    }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{ padding: '0 24px 20px', color: '#a1a1aa', lineHeight: '1.7', margin: 0 }}>
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
