import React from 'react';
import { motion } from 'framer-motion';

interface DrawingLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  isLocked?: boolean;
  lockProgress?: number;
}

export default function DrawingLine({ from, to, color, isLocked = false, lockProgress = 0 }: DrawingLineProps) {
  return (
    <g>
      {/* Main line */}
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={isLocked ? "4" : "3"}
        strokeLinecap="round"
        strokeDasharray={isLocked ? "0" : "8 4"}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: 1, 
          opacity: isLocked ? 0.9 : 0.6,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      {/* Glow effect for locked lines */}
      {isLocked && (
        <motion.line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Animated dots along locked line */}
      {isLocked && (
        <>
          {[0, 0.33, 0.66].map((offset, i) => {
            const x = from.x + (to.x - from.x) * offset;
            const y = from.y + (to.y - from.y) * offset;
            
            return (
              <motion.circle
                key={i}
                r="3"
                fill="#FFFFFF"
                initial={{ cx: x, cy: y, opacity: 0 }}
                animate={{
                  cx: to.x,
                  cy: to.y,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "linear",
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
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${2 * Math.PI * 20 * lockProgress} ${2 * Math.PI * 20}`}
          strokeLinecap="round"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.8, scale: 1 }}
        />
      )}
    </g>
  );
}
