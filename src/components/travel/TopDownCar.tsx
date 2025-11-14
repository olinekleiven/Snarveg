import React from "react";

type TopDownCarProps = {
  size?: number;        // px (width)
  color?: string;       // car body color (from node)
  className?: string;    // for motion/positioning
};

export const TopDownCar: React.FC<TopDownCarProps> = ({
  size = 26,
  color = "#EF4444",
  className,
}) => {
  // Calculate height based on aspect ratio from reference image
  const height = size * 2.2; // Car is taller than wide (top-down view)
  
  return (
    <svg
      className={className}
      width={size}
      height={height}
      viewBox="0 0 80 176"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transformOrigin: 'center center' }}
    >
      {/* Car body - rounded rectangular shape, modern and sporty */}
      <rect
        x="12"
        y="8"
        width="56"
        height="160"
        rx="22"
        ry="22"
        fill={color}
        stroke="#111"
        strokeWidth="2.5"
      />

      {/* Front bumper highlight */}
      <rect
        x="18"
        y="8"
        width="44"
        height="14"
        rx="6"
        fill={color}
        opacity="0.85"
      />

      {/* Windshield - dark blue-grey, trapezoidal shape */}
      <path
        d="M 20 22 L 28 38 L 52 38 L 60 22 Z"
        fill="#0D0F11"
        stroke="#111827"
        strokeWidth="1"
      />

      {/* Front headlights - white crescent shapes */}
      <ellipse
        cx="24"
        cy="18"
        rx="3"
        ry="2"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <ellipse
        cx="56"
        cy="18"
        rx="3"
        ry="2"
        fill="#FFFFFF"
        opacity="0.9"
      />

      {/* Side windows - left side */}
      <rect
        x="18"
        y="48"
        width="12"
        height="32"
        rx="4"
        fill="#0D0F11"
        stroke="#111827"
        strokeWidth="1"
      />
      <rect
        x="18"
        y="88"
        width="12"
        height="32"
        rx="4"
        fill="#0D0F11"
        stroke="#111827"
        strokeWidth="1"
      />

      {/* Side windows - right side */}
      <rect
        x="50"
        y="48"
        width="12"
        height="32"
        rx="4"
        fill="#0D0F11"
        stroke="#111827"
        strokeWidth="1"
      />
      <rect
        x="50"
        y="88"
        width="12"
        height="32"
        rx="4"
        fill="#0D0F11"
        stroke="#111827"
        strokeWidth="1"
      />

      {/* Roof section - red between windows */}
      <rect
        x="30"
        y="48"
        width="20"
        height="72"
        rx="8"
        fill={color}
        opacity="0.95"
      />

      {/* Rear window - dark blue-grey, wider trapezoidal */}
      <path
        d="M 20 138 L 28 154 L 52 154 L 60 138 Z"
        fill="#0D0F11"
        stroke="#111827"
        strokeWidth="1"
      />

      {/* Rear bumper highlight */}
      <rect
        x="18"
        y="154"
        width="44"
        height="14"
        rx="6"
        fill={color}
        opacity="0.85"
      />

      {/* Taillights - orange rounded rectangles */}
      <rect
        x="16"
        y="160"
        width="6"
        height="8"
        rx="3"
        fill="#FF8C00"
        opacity="0.9"
      />
      <rect
        x="58"
        y="160"
        width="6"
        height="8"
        rx="3"
        fill="#FF8C00"
        opacity="0.9"
      />

      {/* Subtle body contour lines for depth */}
      <line
        x1="20"
        y1="40"
        x2="20"
        y2="136"
        stroke="#1a1a1a"
        strokeWidth="0.5"
        opacity="0.3"
      />
      <line
        x1="60"
        y1="40"
        x2="60"
        y2="136"
        stroke="#1a1a1a"
        strokeWidth="0.5"
        opacity="0.3"
      />
    </svg>
  );
};

