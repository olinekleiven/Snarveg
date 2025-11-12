import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DrawingLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  isLocked?: boolean;
  lockProgress?: number;
}

// Constants
const LOCKED_STROKE_WIDTH = '4';
const UNLOCKED_STROKE_WIDTH = '3';
const GLOW_STROKE_WIDTH = '12';
const STROKE_LINECAP = 'round';
const LOCKED_DASHARRAY = '0';
const UNLOCKED_DASHARRAY = '8 4';
const GLOW_OPACITY = '0.3';
const LOCKED_OPACITY = 0.9;
const UNLOCKED_OPACITY = 0.6;

// Animation constants
const MAIN_TRANSITION = {
  duration: 0.3,
  ease: 'easeOut' as const,
};

const MAIN_INITIAL = { pathLength: 0, opacity: 0 };

const GLOW_INITIAL = { opacity: 0 };
const GLOW_ANIMATE = { opacity: [0.1, 0.3, 0.1] };
const GLOW_TRANSITION = {
  duration: 2,
  repeat: Infinity,
};

const DOT_OFFSETS = [0, 0.33, 0.66] as const;
const DOT_RADIUS = '3';
const DOT_FILL = '#FFFFFF';
const DOT_OPACITY_ANIMATE = [0, 1, 0];
const DOT_TRANSITION_BASE = {
  duration: 1.5,
  repeat: Infinity,
  ease: 'linear' as const,
};

const PROGRESS_CIRCLE_RADIUS = 20;
const PROGRESS_CIRCLE_STROKE_WIDTH = '3';
const PROGRESS_CIRCLE_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_CIRCLE_RADIUS;
const PROGRESS_INITIAL = { opacity: 0, scale: 0.8 };
const PROGRESS_ANIMATE = { opacity: 0.8, scale: 1 };

function DrawingLine({ from, to, color, isLocked = false, lockProgress = 0 }: DrawingLineProps) {
  // Memoize main line animate object
  const mainAnimate = useMemo(
    () => ({
      pathLength: 1,
      opacity: isLocked ? LOCKED_OPACITY : UNLOCKED_OPACITY,
    }),
    [isLocked]
  );

  // Memoize stroke width and dasharray
  const strokeWidth = isLocked ? LOCKED_STROKE_WIDTH : UNLOCKED_STROKE_WIDTH;
  const strokeDasharray = isLocked ? LOCKED_DASHARRAY : UNLOCKED_DASHARRAY;

  // Memoize progress circle strokeDasharray calculation
  const progressStrokeDasharray = useMemo(
    () => `${PROGRESS_CIRCLE_CIRCUMFERENCE * lockProgress} ${PROGRESS_CIRCLE_CIRCUMFERENCE}`,
    [lockProgress]
  );

  return (
    <g>
      {/* Main line */}
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap={STROKE_LINECAP}
        strokeDasharray={strokeDasharray}
        initial={MAIN_INITIAL}
        animate={mainAnimate}
        transition={MAIN_TRANSITION}
      />

      {/* Glow effect for locked lines */}
      {isLocked && (
        <motion.line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={color}
          strokeWidth={GLOW_STROKE_WIDTH}
          strokeLinecap={STROKE_LINECAP}
          opacity={GLOW_OPACITY}
          initial={GLOW_INITIAL}
          animate={GLOW_ANIMATE}
          transition={GLOW_TRANSITION}
        />
      )}

      {/* Animated dots along locked line */}
      {isLocked && (
        <>
          {DOT_OFFSETS.map((offset, i) => {
            const x = from.x + (to.x - from.x) * offset;
            const y = from.y + (to.y - from.y) * offset;
            
            return (
              <motion.circle
                key={i}
                r={DOT_RADIUS}
                fill={DOT_FILL}
                initial={{ cx: x, cy: y, opacity: 0 }}
                animate={{
                  cx: to.x,
                  cy: to.y,
                  opacity: DOT_OPACITY_ANIMATE,
                }}
                transition={{
                  ...DOT_TRANSITION_BASE,
                  delay: i * 0.5,
                }}
              />
            );
          })}
        </>
      )}

      {/* Lock progress indicator */}
      {!isLocked && lockProgress > 0 && (
        <motion.circle
          cx={to.x}
          cy={to.y}
          r={PROGRESS_CIRCLE_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={PROGRESS_CIRCLE_STROKE_WIDTH}
          strokeDasharray={progressStrokeDasharray}
          strokeLinecap={STROKE_LINECAP}
          initial={PROGRESS_INITIAL}
          animate={PROGRESS_ANIMATE}
        />
      )}
    </g>
  );
}

export default React.memo(DrawingLine);
