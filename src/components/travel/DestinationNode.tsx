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
  isDisabled?: boolean;
  isDeleting?: boolean;
  isEditMode?: boolean;
  onDeleteClick?: (e: React.MouseEvent) => void;
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
  isDisabled = false,
  isDeleting = false,
  isEditMode = false,
  onDeleteClick,
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
        scale: isDeleting ? 0.85 : (isHovered ? 1.15 : 1),
        opacity: isDeleting ? 0.5 : 1,
        rotate: isPressed && !isDeleting ? [0, -5, 5, -5, 0] : 0,
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        rotate: { duration: 0.3 }
      }}
    >
      {/* Deletion indicator */}
      {isDeleting && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-red-500"
          initial={{ scale: 1, opacity: 0 }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Pulse effect when hovered (but not when deleting) */}
      {isHovered && !isDeleting && (
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
      {isSelected && !isHovered && !isDeleting && (
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
        } ${!isDrawable || isDisabled ? 'opacity-40' : ''} ${
          destination.isEmpty ? 'bg-gray-100 border-2 border-dashed border-gray-300' : ''
        } ${isDisabled ? 'cursor-not-allowed' : ''}`}
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
          <div className={`text-4xl font-light ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>+</div>
        ) : (
          <div className="text-2xl filter drop-shadow-sm">{destination.emoji}</div>
        )}
      </div>

      {/* Delete button in edit mode */}
      {isEditMode && !isCenter && !destination.isEmpty && destination.label !== 'Legg til sted' && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick?.(e);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg z-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M9 3L3 9M3 3L9 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </motion.button>
      )}

      {/* Label */}
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
        <span className={`text-xs bg-white/90 backdrop-blur px-2 py-1 rounded-full shadow-sm ${
          isDisabled ? 'text-gray-400' : 'text-gray-700'
        }`}>
          {isDisabled && destination.isEmpty ? 'Maks 20 destinasjoner' : destination.label}
        </span>
      </div>
    </motion.div>
  );
}
