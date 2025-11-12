import React from 'react';
import { motion } from 'framer-motion';

// Constants for gradient orbs animations
const ORB_1_ANIMATE = {
  x: [0, 100, 0],
  y: [0, -50, 0],
  scale: [1, 1.2, 1],
};

const ORB_1_TRANSITION = {
  duration: 20,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const ORB_1_STYLE = { top: '10%', left: '10%' };

const ORB_2_ANIMATE = {
  x: [0, -80, 0],
  y: [0, 100, 0],
  scale: [1, 1.3, 1],
};

const ORB_2_TRANSITION = {
  duration: 25,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const ORB_2_STYLE = { top: '50%', right: '10%' };

const ORB_3_ANIMATE = {
  x: [0, 60, 0],
  y: [0, -80, 0],
  scale: [1, 1.1, 1],
};

const ORB_3_TRANSITION = {
  duration: 18,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const ORB_3_STYLE = { bottom: '15%', left: '20%' };

const PARTICLE_COUNT = 15;

// Generate particle data once (outside component to avoid recalculation)
function generateParticleData(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const randomX = Math.random() * 100 - 50;
    const randomDuration = 10 + Math.random() * 10;
    const randomDelay = Math.random() * 10;
    const randomLeft = Math.random() * 100;
    
    return {
      id: i,
      animate: {
        y: [0, -1000],
        x: [0, randomX],
        opacity: [0, 1, 0],
      },
      transition: {
        duration: randomDuration,
        repeat: Infinity,
        delay: randomDelay,
        ease: 'linear' as const,
      },
      style: {
        left: `${randomLeft}%`,
        bottom: 0,
      },
    };
  });
}

const PARTICLE_DATA = generateParticleData(PARTICLE_COUNT);

export default React.memo(function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-gradient-to-br from-blue-300/30 to-indigo-400/30 blur-3xl"
        animate={ORB_1_ANIMATE}
        transition={ORB_1_TRANSITION}
        style={ORB_1_STYLE}
      />
      
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-purple-300/30 to-pink-400/30 blur-3xl"
        animate={ORB_2_ANIMATE}
        transition={ORB_2_TRANSITION}
        style={ORB_2_STYLE}
      />
      
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-cyan-300/30 to-blue-400/30 blur-3xl"
        animate={ORB_3_ANIMATE}
        transition={ORB_3_TRANSITION}
        style={ORB_3_STYLE}
      />

      {/* Floating particles */}
      {PARTICLE_DATA.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
          animate={particle.animate}
          transition={particle.transition}
          style={particle.style}
        />
      ))}
    </div>
  );
});
