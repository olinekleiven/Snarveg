import React, { useState, useMemo, useCallback } from 'react';
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

// Constants
const RADIUS = 40; // Half of node size (80px / 2)
const STROKE_WIDTH = 4;
const NORMALIZED_RADIUS = RADIUS - STROKE_WIDTH / 2;
const CIRCUMFERENCE = NORMALIZED_RADIUS * 2 * Math.PI;

// Animation constants
const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

const SPRING_TRANSITION_STIFF = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
};

const DELETE_ANIMATION = {
  scale: [1, 1.1, 1],
  opacity: [0.6, 0.8, 0.6],
};

const DELETE_TRANSITION = {
  duration: 0.5,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const PULSE_ANIMATION = {
  scale: [1, 1.3, 1],
  opacity: [0.3, 0, 0.3],
};

const PULSE_TRANSITION = {
  duration: 1,
  repeat: Infinity,
};

const ROTATE_ANIMATION = [0, -5, 5, -5, 0];
const ROTATE_TRANSITION = { duration: 0.3 };

// Center node SVG (static, can be extracted)
const CenterNodeIcon = () => (
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
);

// Delete button SVG (static)
const DeleteIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M9 3L3 9M3 3L9 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

function DestinationNode({
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
  
  // Memoize stroke dash offset calculation
  const strokeDashoffset = useMemo(
    () => CIRCUMFERENCE - (lockProgress * CIRCUMFERENCE),
    [lockProgress]
  );

  // Memoize box shadow calculation
  const boxShadow = useMemo(
    () => isSelected || isHovered
      ? `0 10px 40px -10px ${destination.color}80`
      : '0 4px 20px rgba(0,0,0,0.1)',
    [isSelected, isHovered, destination.color]
  );

  // Memoize className calculations
  const nodeClassName = useMemo(() => {
    const base = 'relative w-full h-full rounded-full shadow-xl flex flex-col items-center justify-center backdrop-blur-sm transition-all';
    const centerBg = isCenter ? 'bg-gradient-to-br from-gray-700 to-gray-900' : '';
    const opacity = !isDrawable || isDisabled ? 'opacity-40' : '';
    const empty = destination.isEmpty ? 'bg-gray-100 border-2 border-dashed border-gray-300' : '';
    const cursor = isDisabled ? 'cursor-not-allowed' : '';
    return `${base} ${centerBg} ${opacity} ${empty} ${cursor}`.trim();
  }, [isCenter, isDrawable, isDisabled, destination.isEmpty]);

  const labelClassName = useMemo(
    () => `text-xs bg-white/90 backdrop-blur px-2 py-1 rounded-full shadow-sm ${
      isDisabled ? 'text-gray-400' : 'text-gray-700'
    }`,
    [isDisabled]
  );

  // Memoize event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsPressed(true);
    onPointerDown?.(e);
  }, [onPointerDown]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handlePointerCancel = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick?.(e);
  }, [onDeleteClick]);

  // Memoize animate object
  const animateProps = useMemo(() => ({
    scale: isDeleting ? 0.85 : (isHovered ? 1.15 : 1),
    opacity: isDeleting ? 0.5 : 1,
    rotate: isPressed && !isDeleting ? ROTATE_ANIMATION : 0,
  }), [isDeleting, isHovered, isPressed]);

  // Memoize transition object
  const transitionProps = useMemo(() => ({
    ...SPRING_TRANSITION,
    rotate: ROTATE_TRANSITION,
  }), []);
  
  return (
    <motion.div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={onContextMenu}
      className="relative cursor-pointer touch-none w-20 h-20"
      whileHover={{ scale: isCenter ? 1 : 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={animateProps}
      transition={transitionProps}
    >
      {/* Deletion indicator */}
      {isDeleting && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-red-500"
          initial={{ scale: 1, opacity: 0 }}
          animate={DELETE_ANIMATION}
          transition={DELETE_TRANSITION}
        />
      )}

      {/* Pulse effect when hovered (but not when deleting) */}
      {isHovered && !isDeleting && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: destination.color }}
          animate={PULSE_ANIMATION}
          transition={PULSE_TRANSITION}
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
          transition={SPRING_TRANSITION_STIFF}
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
            r={NORMALIZED_RADIUS}
            stroke={destination.color}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
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
        className={nodeClassName}
        style={{
          backgroundColor: isCenter || destination.isEmpty ? undefined : destination.color,
          boxShadow,
        }}
      >
        {isCenter ? (
          <CenterNodeIcon />
        ) : destination.isEmpty ? (
          <div className={`text-4xl font-light ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>+</div>
        ) : (
          <div className="text-2xl filter drop-shadow-sm">{destination.emoji}</div>
        )}
      </div>

      {/* Delete button in edit mode */}
      {isEditMode && !isCenter && !destination.isEmpty && destination.label !== 'Legg til sted' && (
        <motion.button
          onClick={handleDeleteClick}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg z-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <DeleteIcon />
        </motion.button>
      )}

      {/* Label */}
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
        <span className={labelClassName}>
          {isDisabled && destination.isEmpty ? 'Maks 20 destinasjoner' : destination.label}
        </span>
      </div>
    </motion.div>
  );
}

export default React.memo(DestinationNode);
