import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-gradient-to-br from-blue-300/30 to-indigo-400/30 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ top: '10%', left: '10%' }}
      />
      
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-purple-300/30 to-pink-400/30 blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ top: '50%', right: '10%' }}
      />
      
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-cyan-300/30 to-blue-400/30 blur-3xl"
        animate={{
          x: [0, 60, 0],
          y: [0, -80, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ bottom: '15%', left: '20%' }}
      />

      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
          animate={{
            y: [0, -1000],
            x: [0, Math.random() * 100 - 50],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: 'linear',
          }}
          style={{
            left: `${Math.random() * 100}%`,
            bottom: 0,
          }}
        />
      ))}
    </div>
  );
}
