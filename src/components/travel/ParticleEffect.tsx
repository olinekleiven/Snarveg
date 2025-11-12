import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParticleEffectProps {
  x: number;
  y: number;
  color: string;
  trigger: number; // Change this to trigger new particles
}

interface Particle {
  id: number;
  endX: number;
  endY: number;
  size: number;
}

// Constants
const PARTICLE_COUNT = 12;
const FULL_CIRCLE = 360;
const DISTANCE_MIN = 50;
const DISTANCE_RANGE = 30;
const SIZE_MIN = 4;
const SIZE_RANGE = 4;
const CLEANUP_DELAY = 600;
const GLOW_SIZE = 8;

// Animation constants
const ANIMATION_TRANSITION = {
  duration: 0.6,
  ease: 'easeOut' as const,
};

const INITIAL_STATE = { x: 0, y: 0, scale: 1, opacity: 1 };
const EXIT_STATE = { opacity: 0 };

function ParticleEffect({ x, y, color, trigger }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (trigger > 0) {
      // Generate particles with pre-calculated end positions
      const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * FULL_CIRCLE;
        const rad = (angle * Math.PI) / 180;
        const distance = DISTANCE_MIN + Math.random() * DISTANCE_RANGE;
        
        return {
          id: Date.now() + i,
          endX: Math.cos(rad) * distance,
          endY: Math.sin(rad) * distance,
          size: SIZE_MIN + Math.random() * SIZE_RANGE,
        };
      });
      
      setParticles(newParticles);

      // Clear existing timeout if any
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        setParticles([]);
        timeoutRef.current = null;
      }, CLEANUP_DELAY);
    }

    // Cleanup timeout on unmount or when trigger changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [trigger]);

  // Memoize box shadow style
  const boxShadowStyle = `0 0 ${GLOW_SIZE}px ${color}`;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={INITIAL_STATE}
            animate={{
              x: particle.endX,
              y: particle.endY,
              scale: 0,
              opacity: 0,
            }}
            exit={EXIT_STATE}
            transition={ANIMATION_TRANSITION}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: color,
              boxShadow: boxShadowStyle,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ParticleEffect);
