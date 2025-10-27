import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Destination } from './types';

interface DestinationNodeProps {
  destination: Destination;
  isSelected: boolean;
  isHovered?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  isCenter?: boolean;
  isDrawable?: boolean;
  lockProgress?: number;
}

export default function DestinationNode({
  destination,
  isSelected,
  isHovered = false,
  onPointerDown,
  onContextMenu,
  isCenter = false,
  isDrawable = true,
  lockProgress = 0,
}: DestinationNodeProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const radius = 40; // Half of node size (80px / 2)
  const strokeWidth = 4;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (lockProgress * circumference);
  
  return (
    <motion.div
      onPointerDown={(e) => {
        setIsPressed(true);
        onPointerDown?.(e);
      }}
      onPointerUp={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      onContextMenu={onContextMenu}
      className={`relative cursor-pointer touch-none ${isCenter ? 'w-20 h-20' : 'w-20 h-20'}`}
      whileHover={{ scale: isCenter ? 1 : 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isHovered ? 1.15 : 1,
        rotate: isPressed ? [0, -5, 5, -5, 0] : 0,
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        rotate: { duration: 0.3 }
      }}
    >
      {/* Pulse effect when hovered */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: destination.color,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      )}

      {/* Selection ring */}
      {isSelected && !isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full border-3"
          style={{
            borderColor: destination.color,
            borderWidth: '3px',
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      )}

      {/* Progress ring when hovering (auto-lock timer) */}
      {isHovered && lockProgress > 0 && (
        <svg
          className="absolute inset-0 -rotate-90"
          width="80"
          height="80"
        >
          <circle
            cx="40"
            cy="40"
            r={normalizedRadius}
            stroke={destination.color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.016s linear',
              filter: `drop-shadow(0 0 8px ${destination.color})`,
            }}
          />
        </svg>
      )}

      {/* Node circle */}
      <div
        className={`relative w-full h-full rounded-full shadow-xl flex flex-col items-center justify-center backdrop-blur-sm transition-all ${
          isCenter ? 'bg-gradient-to-br from-gray-700 to-gray-900' : ''
        } ${!isDrawable ? 'opacity-40' : ''} ${
          destination.isEmpty ? 'bg-gray-100 border-2 border-dashed border-gray-300' : ''
        }`}
        style={{
          backgroundColor: isCenter || destination.isEmpty ? undefined : destination.color,
          boxShadow: isSelected || isHovered
            ? `0 10px 40px -10px ${destination.color}80`
            : '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        {isCenter ? (
          // Simple person sketch for center node
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            {/* Head */}
            <circle cx="12" cy="6" r="3" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
            {/* Body */}
            <path d="M12 9 L12 16" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
            {/* Arms */}
            <path d="M8 12 L12 11 L16 12" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Legs */}
            <path d="M12 16 L9 21" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 16 L15 21" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : destination.isEmpty ? (
          // Show "+" icon for empty nodes
          <div className="text-4xl font-light text-gray-500">+</div>
        ) : (
          <div className="text-2xl filter drop-shadow-sm">{destination.emoji}</div>
        )}
      </div>

      {/* Label */}
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
        <span className="text-xs text-gray-700 bg-white/90 backdrop-blur px-2 py-1 rounded-full shadow-sm">
          {destination.label}
        </span>
      </div>
    </motion.div>
  );
}
