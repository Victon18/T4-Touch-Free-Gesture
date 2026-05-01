'use client';

import Link from 'next/link';
import { HandMetal } from 'lucide-react';
import { FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa';

const navCols = [
  {
    heading: 'Product',
    links: [
      { label: 'Use Cases', href: '#features' },
      { label: 'Download', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Gesture Library', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        width: '100%',
        background: '#000',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '64px',
        paddingBottom: '32px',
      }}
    >
      <div className="container mx-auto px-6">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
            gap: '48px',
            marginBottom: '64px',
          }}
        >
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', textDecoration: 'none' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg,#22d3ee,#8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(34,211,238,0.35)',
                }}
              >
                <HandMetal style={{ width: '20px', height: '20px', color: '#fff' }} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Gestura</span>
            </Link>
            <p style={{ color: '#71717a', fontSize: '14px', lineHeight: '1.7', marginBottom: '20px' }}>
              AI-powered hand gesture control for your PC. Control everything, touch nothing.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                style={{ color: '#71717a', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#22d3ee')}
                onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}>
                <FaTwitter size={18} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                style={{ color: '#71717a', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}>
                <FaGithub size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                style={{ color: '#71717a', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#8b5cf6')}
                onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}>
                <FaLinkedin size={18} />
              </a>
            </div>
          </div>

          {/* Nav cols */}
          {navCols.map((col) => (
            <div key={col.heading}>
              <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '16px', fontSize: '15px' }}>
                {col.heading}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      style={{ color: '#71717a', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
          className="md:flex-row"
        >
          <p style={{ color: '#3f3f46', fontSize: '14px', margin: 0 }}>
            &copy; {new Date().getFullYear()} Gestura AI, Inc. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', color: '#71717a' }}>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
