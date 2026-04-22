'use client'

import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import DotField from "./reactbits/DotField";

const faqs = [
  {
    question: 'What hardware do I need?',
    answer: 'You only need a standard webcam connected to your computer. T4 works with any modern desktop or laptop that has a webcam and runs Windows or Linux.'
  },
  {
    question: 'Is my data secure and private?',
    answer: 'Absolutely. All processing happens locally on your device. No video, images, or data is sent to any external server. Your privacy is our top priority.'
  },
  {
    question: 'How accurate are the gesture recognitions?',
    answer: 'T4 uses advanced AI hand tracking models that achieve high accuracy in standard lighting conditions. Accuracy depends on camera resolution, lighting, and hand position relative to the camera.'
  },
  {
    question: 'Does it work in low light?',
    answer: 'T4 performs best in well-lit environments similar to natural office lighting. Very dark conditions may reduce accuracy. We recommend adequate lighting for optimal performance.'
  },
  {
    question: 'Can I use multiple hands at once?',
    answer: 'Currently, T4 is optimized for single-hand interaction. Multi-hand support is on our roadmap for future releases.'
  },
  {
    question: 'What operating systems are supported?',
    answer: 'T4 is available for Windows and Linux. macOS support is planned for upcoming releases.'
  },
  {
    question: 'Is there a free version?',
    answer: 'Yes! T4 is completely free and open-source. You can download it for free and use all features without any limitations or premium tiers.'
  },
  {
    question: 'How much processing power does it need?',
    answer: 'T4 is optimized to run efficiently on mid-range consumer hardware. It typically uses 5-15% CPU on modern processors while maintaining real-time performance.'
  }
];

const FAQ = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
<>

    <div className="w-full h-full bg-neutral-900 relative z-10 overflow-hidden"
      style={{
        background: '#111111', // 👈 gray background
        position: 'relative',
        zIndex: 5
      }}
>
  <DotField
    dotRadius={1.5}
    dotSpacing={14}
    bulgeStrength={67}
    glowRadius={160}
    sparkle={false}
    waveAmplitude={0}
    cursorRadius={500}
    cursorForce={0.1}
    bulgeOnly
    gradientFrom="#A855F7"
    gradientTo="#B497CF"
    glowColor="#120F17"
/>

</div>
</>
  );
};

export default FAQ;

        {/* Section header
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-gray-300">
            Everything you need to know about T4
          </p>
        </motion.div>

        {/* FAQ Items }
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full text-left"
              >
                <div className="group relative w-full rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-4 sm:p-6 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
                  {/* Glow effect }
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />

                  {/* Content }
                  <div className="relative flex items-center justify-between gap-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {faq.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown size={24} className="text-blue-400" />
                    </motion.div>
                  </div>
                </div>
              </button>

              {/* Answer }
              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-900/30 to-gray-800/30 border-l-2 border-blue-500 mt-2 rounded-lg">
                      <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact section }
        <motion.div
          className="mt-16 p-6 sm:p-8 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-white text-base sm:text-lg mb-4">
            Didn&apos;t find your answer?
          </p>
          <a
            href="mailto:support@t4gesture.com"
            className="inline-block px-6 sm:px-8 py-2 sm:py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors duration-300"
          >
            Contact Us
          </a>
        </motion.div>
      </div> */}

