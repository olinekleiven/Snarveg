import React from 'react';
import { motion } from 'framer-motion';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
}

// Constants for line styling
const GLOW_STROKE_WIDTH = '8';
const MAIN_STROKE_WIDTH = '3';
const STROKE_LINECAP = 'round';
const STROKE_DASHARRAY = '8 4';
const GLOW_OPACITY = '0.2';
const MAIN_OPACITY = 0.7;

// Animation constants
const TRANSITION = {
  duration: 0.6,
  ease: 'easeInOut' as const,
};

const GLOW_INITIAL = { pathLength: 0 };
const GLOW_ANIMATE = { pathLength: 1 };
const GLOW_EXIT = { pathLength: 0 };

const MAIN_INITIAL = { pathLength: 0, opacity: 0 };
const MAIN_ANIMATE = { pathLength: 1, opacity: MAIN_OPACITY };
const MAIN_EXIT = { pathLength: 0, opacity: 0 };

function ConnectionLine({ from, to, color }: ConnectionLineProps) {
  return (
    <>
      {/* Glow effect */}
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={GLOW_STROKE_WIDTH}
        strokeLinecap={STROKE_LINECAP}
        strokeDasharray={STROKE_DASHARRAY}
        opacity={GLOW_OPACITY}
        initial={GLOW_INITIAL}
        animate={GLOW_ANIMATE}
        exit={GLOW_EXIT}
        transition={TRANSITION}
      />
      {/* Main line */}
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={MAIN_STROKE_WIDTH}
        strokeLinecap={STROKE_LINECAP}
        strokeDasharray={STROKE_DASHARRAY}
        initial={MAIN_INITIAL}
        animate={MAIN_ANIMATE}
        exit={MAIN_EXIT}
        transition={TRANSITION}
      />
    </>
  );
}

export default React.memo(ConnectionLine);
