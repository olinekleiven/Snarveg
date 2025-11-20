import React, { useId } from 'react';

interface MinimalMapBackgroundProps {
  className?: string;
}

const MinimalMapBackground: React.FC<MinimalMapBackgroundProps> = ({ className = '' }) => {
  const uniqueId = useId();
  const mapGradientId = `${uniqueId}-map`;
  const waterGradientId = `${uniqueId}-water`;
  const parkGradientId = `${uniqueId}-park`;
  const roadGradientId = `${uniqueId}-road`;

  return (
    <svg
      className={`absolute inset-0 w-full h-full text-gray-100 pointer-events-none ${className}`}
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={mapGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#ECF3F8" />
        </linearGradient>
        <linearGradient id={waterGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9E7F5" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#A7D4EA" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={parkGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFF3D9" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#C8EBC3" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={roadGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BFC8D4" />
          <stop offset="100%" stopColor="#AAB4C2" />
        </linearGradient>
      </defs>

      <rect width="400" height="400" fill={`url(#${mapGradientId})`} />

      <path
        d="M-20 260 C60 200, 160 220, 240 180 C320 140, 420 140, 420 80 L420 420 L-20 420 Z"
        fill={`url(#${waterGradientId})`}
        opacity="0.9"
      />
      <path
        d="M300 0 C280 60, 260 120, 320 200 C360 250, 420 280, 420 320 L420 0 Z"
        fill={`url(#${waterGradientId})`}
        opacity="0.6"
      />

      <path
        d="M-40 120 C60 60, 200 100, 260 60 C320 20, 380 40, 420 0 L420 -40 L-40 -40 Z"
        fill={`url(#${parkGradientId})`}
        opacity="0.8"
      />
      <path
        d="M-40 320 C80 300, 200 340, 280 320 C360 300, 420 340, 420 420 L-40 420 Z"
        fill={`url(#${parkGradientId})`}
        opacity="0.65"
      />

      {[...Array(60)].map((_, idx) => {
        const x = (idx % 10) * 40 + 10;
        const y = Math.floor(idx / 10) * 40 + (idx % 2 === 0 ? 15 : 25);
        return <circle key={idx} cx={x} cy={y} r="1.5" fill="#C6D3E0" opacity="0.5" />;
      })}

      <path
        d="M-20 80 C60 120, 140 140, 200 180 C260 220, 320 240, 420 280"
        stroke={`url(#${roadGradientId})`}
        strokeWidth="16"
        strokeLinecap="round"
        opacity="0.35"
        fill="none"
      />
      <path
        d="M-20 90 C60 130, 140 150, 200 190 C260 230, 320 250, 420 290"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="6 10"
        opacity="0.5"
        fill="none"
      />

      <path
        d="M60 -20 C80 80, 100 160, 140 240 C180 320, 240 380, 320 420"
        stroke={`url(#${roadGradientId})`}
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.25"
        fill="none"
      />
      <path
        d="M420 40 C340 80, 280 140, 220 220 C180 280, 140 320, 60 360"
        stroke={`url(#${roadGradientId})`}
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.2"
        fill="none"
      />
    </svg>
  );
};

export default MinimalMapBackground;

