import React from 'react';
import { motion } from 'framer-motion';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
}

export default function ConnectionLine({ from, to, color }: ConnectionLineProps) {
  return (
    <>
      {/* Glow effect */}
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray="8 4"
        opacity="0.2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        exit={{ pathLength: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      {/* Main line */}
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="8 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.7 }}
        exit={{ pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
    </>
  );
}
