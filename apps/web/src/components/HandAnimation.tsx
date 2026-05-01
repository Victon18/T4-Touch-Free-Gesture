'use client';

import { motion } from 'framer-motion';

export default function HandAnimation() {
  const points: { id: number, x: number, y: number }[] = [
    { id: 0, x: 50, y: 90 }, // Wrist
    { id: 1, x: 30, y: 60 }, // Thumb base
    { id: 2, x: 20, y: 40 }, // Thumb mid
    { id: 3, x: 10, y: 30 }, // Thumb tip
    { id: 4, x: 40, y: 45 }, // Index base
    { id: 5, x: 35, y: 20 }, // Index mid
    { id: 6, x: 30, y: 5 },  // Index tip
    { id: 7, x: 50, y: 42 }, // Middle base
    { id: 8, x: 50, y: 15 }, // Middle mid
    { id: 9, x: 50, y: 0 },  // Middle tip
    { id: 10, x: 60, y: 45 },// Ring base
    { id: 11, x: 65, y: 20 },// Ring mid
    { id: 12, x: 70, y: 5 }, // Ring tip
    { id: 13, x: 70, y: 50 },// Pinky base
    { id: 14, x: 80, y: 30 },// Pinky mid
    { id: 15, x: 85, y: 15 },// Pinky tip
  ];

  const connections: [number, number][] = [
    [0, 1], [1, 2], [2, 3], // Thumb
    [0, 4], [4, 5], [5, 6], // Index
    [0, 7], [7, 8], [8, 9], // Middle
    [0, 10], [10, 11], [11, 12], // Ring
    [0, 13], [13, 14], [14, 15], // Pinky
    [4, 7], [7, 10], [10, 13] // Palm
  ];

  return (
    <div className="relative w-64 h-80 mx-auto">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
        {/* Lines */}
        {connections.map(([start, end], i) => (
          <motion.line
            key={`line-${i}`}
            x1={points[start]!.x}
            y1={points[start]!.y}
            x2={points[end]!.x}
            y2={points[end]!.y}
            stroke="rgba(139, 92, 246, 0.5)"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: i * 0.1, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
          />
        ))}
        
        {/* Points */}
        {points.map((point, i) => (
          <motion.circle
            key={`point-${point.id}`}
            cx={point.x}
            cy={point.y}
            r="2.5"
            fill="#22d3ee"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            className="filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
          />
        ))}
      </svg>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-cyan-500/10 blur-[60px] -z-10 rounded-full mix-blend-screen" />
      <div className="absolute inset-0 bg-violet-600/10 blur-[80px] -z-10 rounded-full mix-blend-screen" />
    </div>
  );
}
