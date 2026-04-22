'use client';

import MagicBento from './reactbits/MagicBento';
import {
  Monitor,
  Users,
  Microscope,
  Gamepad,
  MapPin,
  Accessibility
} from 'lucide-react';

const useCases = [
  {
    icon: Monitor,
    title: 'Presentations',
    description: 'Control slides without touching devices',
    label: 'Insights'
  },
  {
    icon: Users,
    title: 'Meetings',
    description: 'Control camera & mic hands-free',
    label: 'Overview'
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'Work together seamlessly',
    label: 'Teamwork'
  },
  {
    icon: Microscope,
    title: 'Automation',
    description: 'Streamline workflows',
    label: 'Efficiency'
  },
  {
    icon: MapPin,
    title: 'Integration',
    description: 'Connect favorite tools',
    label: 'Connectivity'
  },
  {
    icon: Accessibility,
    title: 'Accessibility',
    description: 'Hands-free interaction for everyone',
    label: 'Protection'
  }
];

const UseCases = () => {
  return (
    <div className="w-full h-full bg-neutral-900 relative z-10 overflow-hidden"
      style={{
        background: '#111111', // 👈 gray background
        position: 'relative',
        zIndex: 5
      }}
>
      <MagicBento items={useCases} />
    </div>
  );
};

export default UseCases;
