import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  scale: number;
}

const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#06B6D4', '#22C55E'];

export default function Confetti({ show, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: 0.5 + Math.random() * 0.5,
      }));
      setPieces(newPieces);

      // Clear after animation
      setTimeout(() => {
        setPieces([]);
        if (onComplete) onComplete();
      }, 3000);
    }
  }, [show, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              x: piece.x,
              y: piece.y,
              rotate: piece.rotation,
              scale: piece.scale,
              opacity: 1,
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: piece.rotation + 720,
              opacity: [1, 1, 0.5, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 1,
              ease: 'easeIn',
            }}
            className="absolute w-3 h-3 rounded-sm"
            style={{ backgroundColor: piece.color }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
