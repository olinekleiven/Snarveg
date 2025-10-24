import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParticleEffectProps {
  x: number;
  y: number;
  color: string;
  trigger: number; // Change this to trigger new particles
}

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
}

export default function ParticleEffect({ x, y, color, trigger }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i / 12) * 360,
        distance: 50 + Math.random() * 30,
        size: 4 + Math.random() * 4,
      }));
      setParticles(newParticles);

      setTimeout(() => setParticles([]), 600);
    }
  }, [trigger]);

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      <AnimatePresence>
        {particles.map((particle) => {
          const rad = (particle.angle * Math.PI) / 180;
          const endX = Math.cos(rad) * particle.distance;
          const endY = Math.sin(rad) * particle.distance;

          return (
            <motion.div
              key={particle.id}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: endX,
                y: endY,
                scale: 0,
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
