import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Clock, TrendingUp, Zap, MapPin, X } from 'lucide-react';
import { Route, Destination } from './types';

interface MapViewProps {
  route: Route;
  destinations: Destination[];
  onClose: () => void;
}

interface RouteSegment {
  from: Destination;
  to: Destination;
  transport: string;
  duration: number;
  distance: number;
}

// Constants
const MAP_SPACING = 80;
const MAP_START_Y = 20;
const MAP_X_POSITION = 50;
const SEGMENT_ANIMATION_DELAY = 2000;
const MARKER_ANIMATION_DURATION = 2;
const PULSE_ANIMATION_DURATION = 2;
const ROUTE_ANIMATION_DURATION = 1;

// Animation constants
const SPRING_TRANSITION = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 300,
};

const LINE_TRANSITION = {
  duration: ROUTE_ANIMATION_DURATION,
  ease: 'easeInOut' as const,
};

const PULSE_ANIMATION = {
  scale: [1, 1.4, 1],
  opacity: [0.3, 0, 0.3],
};

const PULSE_TRANSITION = {
  duration: PULSE_ANIMATION_DURATION,
  repeat: Infinity,
};

const BOUNCE_ANIMATION = { y: [0, -5, 0] };
const BOUNCE_TRANSITION = {
  duration: 1.5,
  repeat: Infinity,
};

// Helper function to get map position (moved outside component)
function getMapPosition(index: number) {
  return {
    x: MAP_X_POSITION,
    y: MAP_START_Y + (index * MAP_SPACING),
  };
}

function MapView({ route, destinations, onClose }: MapViewProps) {
  const [activeSegment, setActiveSegment] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showRouteDetails, setShowRouteDetails] = useState(false);

  // Memoize route destinations
  const routeDestinations = useMemo(() => {
    return route.destinations
      .map(id => destinations.find(d => d.id === id))
      .filter(Boolean) as Destination[];
  }, [route.destinations, destinations]);

  // Memoize route segments
  const segments = useMemo(() => {
    const segs: RouteSegment[] = [];
    const segmentCount = routeDestinations.length - 1;
    if (segmentCount <= 0) return segs;
    
    const segmentDuration = Math.floor(route.totalTime / segmentCount);
    const segmentDistance = route.totalDistance / segmentCount;
    
    for (let i = 0; i < segmentCount; i++) {
      segs.push({
        from: routeDestinations[i],
        to: routeDestinations[i + 1],
        transport: route.transportModes[i],
        duration: segmentDuration,
        distance: segmentDistance,
      });
    }
    return segs;
  }, [routeDestinations, route.transportModes, route.totalTime, route.totalDistance]);

  // Animate through segments
  useEffect(() => {
    if (isAnimating && activeSegment < segments.length - 1) {
      const timer = setTimeout(() => {
        setActiveSegment(prev => prev + 1);
      }, SEGMENT_ANIMATION_DELAY);
      return () => clearTimeout(timer);
    } else if (activeSegment >= segments.length - 1) {
      setIsAnimating(false);
    }
  }, [activeSegment, isAnimating, segments.length]);

  const handleShowDetails = useCallback(() => {
    setShowRouteDetails(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setShowRouteDetails(false);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#F5F3EE] relative overflow-hidden">
      {/* Map-like background with streets */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" className="opacity-30">
          <defs>
            {/* Street pattern */}
            <pattern id="streets" width="120" height="120" patternUnits="userSpaceOnUse">
              {/* Horizontal streets */}
              <line x1="0" y1="40" x2="120" y2="40" stroke="#D1C4B8" strokeWidth="2" />
              <line x1="0" y1="80" x2="120" y2="80" stroke="#D1C4B8" strokeWidth="1.5" />
              {/* Vertical streets */}
              <line x1="40" y1="0" x2="40" y2="120" stroke="#D1C4B8" strokeWidth="2" />
              <line x1="80" y1="0" x2="80" y2="120" stroke="#D1C4B8" strokeWidth="1.5" />
            </pattern>
            {/* Park areas */}
            <pattern id="parks" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="30" fill="#D4E7D4" opacity="0.4" />
              <circle cx="150" cy="150" r="25" fill="#D4E7D4" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#streets)" />
          <rect width="100%" height="100%" fill="url(#parks)" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-gray-900 mb-1">Navigasjon aktiv</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{route.totalTime} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="w-4 h-4" />
                <span>{route.totalDistance} km</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
          >
            Avslutt
          </button>
        </div>

        {/* Current leg info */}
        {activeSegment < segments.length && (
          <motion.div
            key={activeSegment}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-3.5 border border-blue-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border-2 border-blue-200">
                {segments[activeSegment].transport}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 text-sm">
                  {segments[activeSegment].from.label} → {segments[activeSegment].to.label}
                </p>
                <p className="text-gray-600 text-xs mt-0.5">
                  {segments[activeSegment].duration} min • {segments[activeSegment].distance.toFixed(1)} km
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Map visualization */}
      <div className="flex-1 relative z-10 overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            {/* Gradient for route line - blue like maps */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4285F4" stopOpacity="1" />
              <stop offset="100%" stopColor="#1967D2" stopOpacity="1" />
            </linearGradient>
            
            {/* Drop shadow for route */}
            <filter id="routeShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.2"/>
            </filter>
          </defs>

          {/* Route path */}
          {segments.map((_, index) => {
            const fromPos = getMapPosition(index);
            const toPos = getMapPosition(index + 1);
            const isActive = index <= activeSegment;
            const isCurrent = index === activeSegment;

            return (
              <motion.g key={index}>
                {/* Route line background (white outline) */}
                <motion.line
                  x1={`${fromPos.x}%`}
                  y1={fromPos.y}
                  x2={`${toPos.x}%`}
                  y2={toPos.y}
                  stroke="#FFFFFF"
                  strokeWidth={isActive ? "10" : "5"}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: isActive ? 1 : 0, 
                    opacity: isActive ? 0.9 : 0.2,
                  }}
                  transition={LINE_TRANSITION}
                />
                
                {/* Route line */}
                <motion.line
                  x1={`${fromPos.x}%`}
                  y1={fromPos.y}
                  x2={`${toPos.x}%`}
                  y2={toPos.y}
                  stroke={isActive ? "#4285F4" : "#D1D5DB"}
                  strokeWidth={isActive ? "6" : "3"}
                  strokeLinecap="round"
                  strokeDasharray={isActive ? "0" : "8,4"}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: isActive ? 1 : 0, 
                    opacity: isActive ? 1 : 0.4,
                  }}
                  transition={LINE_TRANSITION}
                  filter={isActive ? "url(#routeShadow)" : undefined}
                />

                {/* Animated position marker along active segment */}
                {isCurrent && isAnimating && (
                  <motion.circle
                    cx={`${fromPos.x}%`}
                    cy={fromPos.y}
                    r="6"
                    fill="#4285F4"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    initial={{ 
                      offsetDistance: "0%",
                    }}
                    animate={{
                      offsetDistance: "100%",
                    }}
                    transition={{
                      duration: MARKER_ANIMATION_DURATION,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      offsetPath: `path("M ${fromPos.x}% ${fromPos.y} L ${toPos.x}% ${toPos.y}")`,
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                    }}
                  />
                )}
              </motion.g>
            );
          })}
        </svg>

        {/* Destination markers */}
        <div className="absolute inset-0">
          {routeDestinations.map((dest, index) => {
            const pos = getMapPosition(index);
            const isActive = index <= activeSegment + 1;
            const isCurrent = index === activeSegment + 1;
            const isFirst = index === 0;

            return (
              <motion.div
                key={dest.id}
                className="absolute"
                style={{
                  left: `${pos.x}%`,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isActive ? 1 : 0.8, 
                  opacity: isActive ? 1 : 0.5,
                }}
                transition={{ delay: index * 0.2 }}
              >
                {/* Pulse effect for current destination */}
                {isCurrent && isAnimating && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: dest.color,
                      width: '70px',
                      height: '70px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                    animate={PULSE_ANIMATION}
                    transition={PULSE_TRANSITION}
                  />
                )}

                {/* Map pin style marker */}
                {isFirst ? (
                  <div className="relative z-10">
                    {/* Red location pin for starting position */}
                    <motion.div
                      className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white relative"
                      animate={isCurrent ? BOUNCE_ANIMATION : {}}
                      transition={isCurrent ? BOUNCE_TRANSITION : {}}
                    >
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </motion.div>
                    {/* Pin pointer */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-[35px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-red-500"></div>
                  </div>
                ) : (
                  <div
                    className="w-14 h-14 rounded-full bg-white border-3 flex items-center justify-center text-xl shadow-lg relative z-10"
                    style={{
                      borderColor: isActive ? dest.color : '#E5E7EB',
                      boxShadow: isActive ? `0 4px 20px ${dest.color}60` : '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    {dest.emoji}
                  </div>
                )}

                {/* Label */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span 
                    className="text-xs px-2.5 py-1 rounded-full shadow-sm"
                    style={{
                      backgroundColor: isActive ? dest.color : '#F3F4F6',
                      color: isActive ? '#FFFFFF' : '#6B7280',
                    }}
                  >
                    {dest.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Transport mode suggestions */}
      <div className="relative z-10 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="space-y-3">
          <p className="text-gray-700 text-sm">Alternative ruter</p>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Fastest route */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50 border border-green-200 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-green-700 text-xs">Raskeste</span>
              </div>
              <p className="text-gray-900 text-sm">{route.totalTime - 5} min</p>
              <p className="text-gray-600 text-xs">Via bybanen</p>
            </motion.div>

            {/* Eco route */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 text-xs">Miljøvennlig</span>
              </div>
              <p className="text-gray-900 text-sm">{route.totalTime + 8} min</p>
              <p className="text-gray-600 text-xs">Gå + sykkel</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="relative z-10 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="flex gap-3">
          <button 
            onClick={handleShowDetails}
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors text-center"
          >
            Se detaljer
          </button>
          <button className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-center">
            Start tur
          </button>
        </div>
      </div>

      {/* Route Details Sheet */}
      <AnimatePresence>
        {showRouteDetails && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetails}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={SPRING_TRANSITION}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[201] max-h-[75vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900">Rutedetaljer</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{route.totalTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      <span>{route.totalDistance} km</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(75vh-120px)] px-4 py-4">
                <div className="space-y-3">
                  {routeDestinations.map((dest, index) => {
                    const isFirst = index === 0;
                    const isLast = index === routeDestinations.length - 1;
                    const transportMode = !isLast ? route.transportModes[index] : null;
                    const legTime = !isLast && routeDestinations.length > 1 
                      ? Math.floor(route.totalTime / (routeDestinations.length - 1)) 
                      : 0;

                    return (
                      <React.Fragment key={dest.id}>
                        {/* Destination */}
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          {/* Icon */}
                          <div
                            className="w-12 h-12 rounded-full bg-white border-3 flex items-center justify-center text-xl shadow-md flex-shrink-0"
                            style={{
                              borderColor: dest.color,
                              boxShadow: `0 2px 12px ${dest.color}40`,
                            }}
                          >
                            {dest.emoji}
                          </div>

                          {/* Info */}
                          <div className="flex-1 pt-1">
                            <h4 className="text-gray-900">{dest.label}</h4>
                            {dest.address && (
                              <div className="flex items-start gap-1.5 text-sm text-gray-500 mt-1">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                <span className="text-xs">{dest.address}</span>
                              </div>
                            )}
                            <div className="mt-2 flex gap-2">
                              {isFirst && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                                  <Navigation className="w-3 h-3" />
                                  <span>Start</span>
                                </div>
                              )}
                              {isLast && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">
                                  ✓ Mål
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>

                        {/* Transport segment */}
                        {!isLast && transportMode && (
                          <motion.div
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            transition={{ delay: index * 0.1 + 0.05 }}
                            className="ml-6 pl-6 border-l-2 border-dashed border-gray-300 py-2"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-lg shadow-md">
                                {transportMode}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">{legTime} min</p>
                                <p className="text-xs text-gray-500">
                                  {transportMode === '🚶‍♂️' && 'Gå'}
                                  {transportMode === '🚌' && 'Buss'}
                                  {transportMode === '🚈' && 'Bybanen'}
                                  {transportMode === '🚲' && 'Sykkel'}
                                  {transportMode === '🛳️' && 'Ferge'}
                                  {transportMode === '🚕' && 'Taxi'}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(MapView);
