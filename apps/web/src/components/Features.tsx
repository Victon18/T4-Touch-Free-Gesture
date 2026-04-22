'use client'

import { motion } from 'motion/react';
import {
  Zap,
  Eye,
  Hand,
  Accessibility,
  Shield,
  Smartphone
} from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'AI Hand Tracking',
    description: 'Real-time hand landmark detection powered by advanced computer vision AI models',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Hand,
    title: 'Natural Gestures',
    description: 'Control your device with intuitive hand movements—no buttons or wearables needed',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Low-latency processing optimized for real-time responsiveness on standard hardware',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Accessibility,
    title: 'Accessibility First',
    description: 'Designed for accessibility—enables hands-free interaction for all users',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Shield,
    title: 'Privacy Focused',
    description: 'All processing happens locally on your device—no data sent to the cloud',
    color: 'from-red-500 to-pink-500'
  },
  {
    icon: Smartphone,
    title: 'Works Anywhere',
    description: 'Compatible with standard webcams—works on any modern desktop or laptop',
    color: 'from-indigo-500 to-blue-500'
  }
];

const Features = () => {
  return (
{/*
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-black">
      { Background gradient }
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl transform -translate-x-1/2" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        { Section header }
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
            Everything you need for seamless, gesture-based control
          </p>
        </motion.div>

        { Features grid }
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                { Card background }
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl border border-gray-700/50 group-hover:border-blue-500/50 transition-colors duration-300" />

                { Glow effect on hover }
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl" />

                { Content }
                <div className="relative p-6 sm:p-8">
                  { Icon }
                  <div className={`mb-4 inline-block p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white`}>
                    <Icon size={28} />
                  </div>

                  { Title and description }
                  <h3 className="text-xl sm:text-lg font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                { Bottom accent }
                <div className={`absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r ${feature.color} group-hover:w-full transition-all duration-500 rounded-b-2xl`} />
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
*/}
  );
};

export default Features;
