import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Clock, TrendingUp, Zap, MapPin, X, Bike } from 'lucide-react';
import { Route, Destination } from './types';
import MinimalMapBackground from './MinimalMapBackground';

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

// Helper function to get map position - simple, clean placement
// Returns percentage values for SVG positioning
function getMapPosition(index: number, total: number) {
  // Simple, clean positions for a minimal map sketch (in percentages)
  const positions = [
    { x: 30, y: 40 },   // Min posisjon (start)
    { x: 70, y: 35 },   // Butikken
    { x: 50, y: 70 },   // Studentsenteret
  ];
  
  // Use predefined positions or spread out for more destinations
  if (index < positions.length) {
    return positions[index];
  }
  
  // Fallback for additional destinations
  return {
    x: 30 + (index % 3) * 25,
    y: 30 + Math.floor(index / 3) * 30,
  };
}

// Helper to get route path - simple and clear
// Positions are in percentage (0-100), used directly as viewBox coordinates
// Path MUST go through ALL nodes in sequence, hitting exact centers
function getRoutePath(routeType: 'fastest' | 'eco' | 'default', positions: Array<{x: number, y: number}>) {
  if (positions.length < 2) return '';
  
  // Always start from first node center
  const pathCommands: string[] = [`M ${positions[0].x} ${positions[0].y}`];
  
  if (routeType === 'fastest') {
    // Direct, precise, straight lines - goes EXACTLY through each node center
    for (let i = 1; i < positions.length; i++) {
      // Straight line directly to next node center
      pathCommands.push(`L ${positions[i].x} ${positions[i].y}`);
    }
  } else if (routeType === 'eco') {
    // Longer, curved path with smooth curves - still goes through ALL node centers
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      
      // Calculate distance and direction for natural curves
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Create smooth curves that still end exactly at node centers
      // Use multiple control points for more natural, rounded curves
      const controlOffsetX = dx * 0.15; // Slight horizontal curve
      const controlOffsetY = dy * 0.15 + (distance * 0.2); // More vertical curve for scenic route
      
      // Control point for smooth curve
      const controlX = prev.x + dx * 0.5 + controlOffsetX;
      const controlY = prev.y + dy * 0.5 + controlOffsetY;
      
      // Use quadratic curve that ends EXACTLY at the node center
      pathCommands.push(`Q ${controlX} ${controlY} ${curr.x} ${curr.y}`);
    }
  }
  
  return pathCommands.join(' ');
}

function MapView({ route, destinations, onClose }: MapViewProps) {
  const [activeSegment, setActiveSegment] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [selectedRouteType, setSelectedRouteType] = useState<'fastest' | 'eco' | 'default'>('default');

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
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Header - matching "Din reiserute" style */}
      <div className="relative z-10 px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <h2 className="text-gray-900 mb-1">Navigasjon aktiv</h2>
        <div className="flex items-center gap-3 text-sm text-gray-600">
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

      {/* Map visualization - simple and clean */}
      <div className="flex-1 relative z-10 overflow-hidden p-4">
        <div className="relative w-full h-full rounded-2xl border border-gray-200 bg-gray-100 overflow-hidden">
          <MinimalMapBackground />
        {/* Destination markers - smaller and simpler */}
        <div className="absolute inset-0 z-10">
          {routeDestinations.map((dest, index) => {
            const pos = getMapPosition(index, routeDestinations.length);
            const isFirst = index === 0;

            return (
              <motion.div
                key={dest.id}
                className="absolute"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Small, discrete markers - route is the focus */}
                {isFirst ? (
                  <div className="relative z-10">
                    {/* Red location pin - very small */}
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border border-white">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    {/* Pin pointer - very small */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-[18px] w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[5px] border-t-red-500"></div>
                  </div>
                ) : (
                  <div
                    className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs"
                    style={{
                      borderColor: dest.color,
                    }}
                  >
                    {dest.emoji}
                  </div>
                )}

                {/* Label - very small and discrete */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                  <span 
                    className="text-[8px] font-medium px-1 py-0.5 rounded"
                    style={{
                      backgroundColor: dest.color,
                      color: '#FFFFFF',
                    }}
                  >
                    {dest.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Route paths - dashed lines, rendered AFTER nodes so they appear on top */}
        <svg width="100%" height="100%" className="absolute inset-0 z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            {/* Drop shadow for route */}
            <filter id="routeShadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.2"/>
            </filter>
          </defs>

          {/* Route paths - dashed lines, only one at a time */}
          {selectedRouteType !== 'default' && routeDestinations.length >= 2 && (() => {
            // Get all node positions - ensure we use ALL destinations in order
            // These positions match exactly where nodes are rendered (center points)
            const nodePositions = routeDestinations.map((_, index) => {
              const pos = getMapPosition(index, routeDestinations.length);
              // Return exact center coordinates for SVG path
              // These match the node centers exactly
              return { x: pos.x, y: pos.y };
            });
            
            // Ensure path goes through ALL nodes in sequence, hitting exact centers
            const routePath = getRoutePath(selectedRouteType, nodePositions);
            const routeColor = selectedRouteType === 'fastest' ? "#10B981" : "#8B5CF6";
            
            // Only render if path is valid and has all nodes
            if (!routePath || routePath.trim() === '' || nodePositions.length < 2) return null;
            
            return (
              <>
                {/* Glow effect for better visibility */}
                <motion.path
                  key={`${selectedRouteType}-glow`}
                  d={routePath}
                  fill="none"
                  stroke={routeColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 3"
                  opacity="0.2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.2 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                {/* Main route line - goes through exact center of each node */}
                <motion.path
                  key={selectedRouteType}
                  d={routePath}
                  fill="none"
                  stroke={routeColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="5 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
                />
              </>
            );
          })()}
        </svg>
        </div>
      </div>

      {/* Transport mode suggestions - clickable routes */}
      <div className="relative z-10 px-4 py-1.5 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <p className="text-gray-700 text-xs font-medium mb-1">Alternative ruter</p>
          
        <div className="grid grid-cols-2 gap-1.5">
          {/* Fastest route - clickable */}
          <motion.button
            onClick={() => setSelectedRouteType(selectedRouteType === 'fastest' ? 'default' : 'fastest')}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-lg p-1.5 text-left transition-all ${
              selectedRouteType === 'fastest'
                ? 'bg-green-100 border-2 border-green-500 shadow-md'
                : 'bg-green-50 border border-green-200 hover:bg-green-100'
            }`}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <Zap className="w-2.5 h-2.5 text-green-600" />
              <span className="text-green-700 text-[10px] font-medium">Raskeste</span>
            </div>
            <p className="text-gray-900 text-xs font-semibold">{route.totalTime - 5} min</p>
            <p className="text-gray-600 text-[10px] mt-0.5">Via bybanen</p>
          </motion.button>

          {/* Eco route - clickable */}
          <motion.button
            onClick={() => setSelectedRouteType(selectedRouteType === 'eco' ? 'default' : 'eco')}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-lg p-1.5 text-left transition-all ${
              selectedRouteType === 'eco'
                ? 'bg-purple-100 border-2 border-purple-500 shadow-md'
                : 'bg-purple-50 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className="w-2.5 h-2.5 text-purple-600" />
              <span className="text-purple-700 text-[10px] font-medium">Miljøvennlig</span>
            </div>
            <p className="text-gray-900 text-xs font-semibold">{route.totalTime + 8} min</p>
            <p className="text-gray-600 text-[10px] mt-0.5">Gå + sykkel</p>
          </motion.button>
        </div>
      </div>

      {/* Bottom action bar */}
      <div 
        className="flex-shrink-0 relative z-10 px-4 pt-2 pb-3"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
          marginBottom: '20px',
        }}
      >
        <div className="flex gap-3">
          <button 
            onClick={handleShowDetails}
            className="flex-1 py-3 bg-white text-gray-800 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center font-medium shadow-sm h-[44px] box-border"
          >
            Se detaljer
          </button>
          <button className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center h-[44px]">
            Åpne i maps
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
                                {transportMode === '🚲' ? (
                                  <Bike className="w-5 h-5 text-white" />
                                ) : (
                                  transportMode
                                )}
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
