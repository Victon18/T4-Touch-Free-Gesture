'use client'

import { motion } from 'motion/react';
import { Camera, Brain, Gamepad2, Zap } from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: Camera,
    title: 'Capture',
    description: 'Your webcam captures hand movements in real-time',
  },
  {
    step: 2,
    icon: Brain,
    title: 'Detect',
    description: 'AI models identify hand landmarks and gestures',
  },
  {
    step: 3,
    icon: Gamepad2,
    title: 'Recognize',
    description: 'System maps gestures to specific actions',
  },
  {
    step: 4,
    icon: Zap,
    title: 'Control',
    description: 'Your device responds instantly to your gestures',
  },
];

const HowItWorks = () => {
  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl transform translate-x-1/2" />
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
            A simple four-step process from gesture to action
          </p>
        </motion.div>

        {/* Steps container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                {/* Connection line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-8 w-16 h-1 bg-gradient-to-r from-blue-500 to-transparent" />
                )}

                {/* Step card */}
                <div className="relative h-full">
                  {/* Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl border border-gray-700/50" />
                  
                  {/* Glow on hover */}
                  <motion.div 
                    className="absolute inset-0 rounded-2xl opacity-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Content */}
                  <div className="relative p-8 flex flex-col h-full">
                    {/* Step number and icon */}
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-4">
                        <Icon size={32} />
                      </div>
                      <div className="inline-block px-4 py-1 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 text-sm font-semibold">
                        Step {item.step}
                      </div>
                    </div>

                    {/* Title and description */}
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed flex-grow">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom text */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="text-gray-400 text-base sm:text-lg">
            All processing happens <span className="text-blue-400 font-semibold">locally on your device</span> — fast, secure, and private
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
