'use client'

import { motion } from 'motion/react';
import { Mail, ExternalLink } from 'lucide-react';
import { GrGithub } from 'react-icons/gr';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Use Cases', href: '#use-cases' },
      { label: 'Download', href: '#download' },
    ],
    resources: [
      { label: 'Documentation', href: '#docs' },
      { label: 'GitHub', href: 'https://github.com' },
      { label: 'Community', href: '#community' },
      { label: 'Blog', href: '#blog' },
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
    ],
  };

  const socials = [
    { icon: GrGithub, href: 'https://github.com', label: 'GitHub' },
    { icon: Mail, href: 'mailto:support@t4gesture.com', label: 'Email' },
  ];

  return (
    <footer className="relative w-full bg-black border-t border-gray-800">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Main footer content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-12">
            {/* Brand section */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-white mb-3 big-shoulders">
                T4
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Touch-free gesture control powered by AI. The future of human-computer interaction.
              </p>
              {/* Social icons */}
              <div className="flex gap-4">
                {socials.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-blue-500 transition-all duration-300"
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon size={18} />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>

            {/* Links sections */}
            {Object.entries(links).map(([category, items], columnIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: (columnIndex + 1) * 0.1 }}
              >
                <h4 className="text-white font-semibold mb-4 capitalize">
                  {category}
                </h4>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors duration-300 group"
                      >
                        <span>{item.label}</span>
                        {item.href.startsWith('http') && (
                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Newsletter section */}
          <motion.div
            className="mb-12 p-6 sm:p-8 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-white text-lg font-semibold mb-3">
              Stay Updated
            </h4>
            <p className="text-gray-400 text-sm mb-4">
              Get the latest news about T4 and gesture control technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <button className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="border-t border-gray-800 mb-8" />

          {/* Bottom footer */}
          <motion.div
            className="flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-400 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p>
              © {currentYear} T4 Touch-Free Gesture. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#privacy" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#terms" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#cookies" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll to top button */}
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition-all"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      </div>
    </footer>
  );
};

export default Footer;
