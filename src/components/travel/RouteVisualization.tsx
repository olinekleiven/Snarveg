import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Navigation, AlertCircle, MapPin, Ticket, ChevronUp, ChevronDown } from 'lucide-react';
import { Route, Destination } from './types';
import MapView from './MapView';
import TicketView from './TicketView';
import TicketOverview from './TicketOverview';

interface RouteVisualizationProps {
  route: Route;
  destinations: Destination[];
  onBack: () => void;
  onPurchaseTicket?: (ticketType: string, duration: number, price: number) => void;
  onEditDestination?: (destination: Destination) => void;
  onReorderRoute?: (newOrder: string[]) => void;
}

interface DestinationItemProps {
  dest: Destination;
  index: number;
  totalCount: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onEdit?: () => void;
}

const DestinationItem: React.FC<DestinationItemProps> = ({
  dest,
  index,
  totalCount,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
}) => {
  const canMoveUp = !isFirst && index > 1; // Can't move past "Min posisjon"
  const canMoveDown = !isLast && index < totalCount - 2; // Can't move past last item

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, type: 'spring' }}
      className="relative"
    >
      <div className="flex items-start gap-3 w-full">
        {/* Reorder buttons - only show for reorderable items */}
        {(canMoveUp || canMoveDown) && (
          <div className="flex flex-col gap-0.5 flex-shrink-0 self-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              disabled={!canMoveUp}
              className={`p-1 rounded-lg transition-all ${
                canMoveUp 
                  ? 'bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 shadow-sm' 
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              disabled={!canMoveDown}
              className={`p-1 rounded-lg transition-all ${
                canMoveDown 
                  ? 'bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 shadow-sm' 
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
        {!canMoveUp && !canMoveDown && <div className="w-6" />}

        {/* Icon */}
        <motion.div
          className="w-14 h-14 rounded-full bg-white border-3 flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
          style={{
            borderColor: dest.color,
            boxShadow: `0 4px 20px ${dest.color}40`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.15 + 0.1, type: 'spring' }}
          whileHover={{ scale: 1.05 }}
        >
          {dest.emoji}
        </motion.div>

        {/* Info */}
        <button
          onClick={onEdit}
          className="flex-1 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-left active:opacity-70 transition-opacity"
        >
          <h3 className="text-gray-900 mb-0.5">{dest.label}</h3>
          {dest.address && (
            <div className="flex items-start gap-1.5 text-sm text-gray-500 mt-1">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span className="text-xs">{dest.address}</span>
            </div>
          )}
          <div className="mt-2 flex gap-2">
            {isFirst && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                <Navigation className="w-3 h-3" />
                <span>Start</span>
              </div>
            )}
            {isLast && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                ✓ Destinasjon
              </div>
            )}
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default function RouteVisualization({ route, destinations, onBack, onPurchaseTicket, onEditDestination, onReorderRoute }: RouteVisualizationProps) {
  const [showMap, setShowMap] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [showTicketOverview, setShowTicketOverview] = useState(false);
  const [localRouteOrder, setLocalRouteOrder] = useState<string[]>(route.destinations);
  
  // Sync localRouteOrder with route.destinations when it changes
  useEffect(() => {
    setLocalRouteOrder(route.destinations);
  }, [route.destinations]);
  
  const routeDestinations = localRouteOrder
    .map(id => destinations.find(d => d.id === id))
    .filter(Boolean) as Destination[];

  const moveDestinationUp = (index: number) => {
    if (index <= 1) return; // Can't move start or above start
    const newOrder = [...localRouteOrder];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setLocalRouteOrder(newOrder);
    onReorderRoute?.(newOrder);
  };

  const moveDestinationDown = (index: number) => {
    if (index >= localRouteOrder.length - 2) return; // Can't move last or below last
    const newOrder = [...localRouteOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setLocalRouteOrder(newOrder);
    onReorderRoute?.(newOrder);
  };

  // Generate random delays for transport modes
  const generateDelayForTransport = (transportMode: string): { hasDelay: boolean; delay: number; reason: string } => {
    // Different probabilities for different transport types
    const delayProbability = {
      '🚌': 0.35,  // Buss - 35% chance
      '🚈': 0.25,  // Bybanen - 25% chance
      '🛳️': 0.30,  // Ferge - 30% chance
      '🚕': 0.20,  // Taxi - 20% chance
      '🚶‍♂️': 0.05, // Walking - 5% chance (weather)
      '🚲': 0.10,  // Sykkel - 10% chance
    };

    const reasons = {
      '🚌': ['trafikk', 'høy pågang', 'tekniske problemer', 'veistengning'],
      '🚈': ['signalproblemer', 'forsinkelse fra tidligere stopp', 'teknisk vedlikehold', 'trafikkork'],
      '🛳️': ['værforhold', 'høy trafikk i havnen', 'tekniske problemer', 'forsinkelse fra forrige rute'],
      '🚕': ['trafikk', 'omvei', 'høy etterspørsel'],
      '🚶‍♂️': ['dårlig vær', 'høy fotgjengertrafikk'],
      '🚲': ['dårlig vær', 'stengt sykkelvei', 'tekniske problemer'],
    };

    const probability = delayProbability[transportMode] || 0.15;
    const hasDelay = Math.random() < probability;
    
    if (!hasDelay) {
      return { hasDelay: false, delay: 0, reason: '' };
    }

    const delayMinutes = Math.floor(Math.random() * 12) + 2; // 2-13 minutes
    const reasonList = reasons[transportMode] || ['forsinkelse'];
    const reason = reasonList[Math.floor(Math.random() * reasonList.length)];

    return { hasDelay: true, delay: delayMinutes, reason };
  };

  // Generate delays for all transport modes (memoize to avoid regeneration on re-render)
  const [transportDelays] = useState(() => 
    route.transportModes.map(mode => generateDelayForTransport(mode))
  );

  // Check if there's any delay on the route
  const hasAnyDelay = transportDelays.some(d => d.hasDelay);
  const totalDelay = transportDelays.reduce((sum, d) => sum + d.delay, 0);

  if (showMap) {
    return <MapView route={route} destinations={destinations} onClose={() => setShowMap(false)} />;
  }

  if (showTicket) {
    return <TicketView route={route} destinations={destinations} onClose={() => setShowTicket(false)} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-gray-900 mb-1">Din reiserute</h2>
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

          <div className="flex gap-1.5">
            {route.transportModes.map((mode, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1, type: 'spring' }}
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-gray-100"
              >
                {mode}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time alert */}
      {hasAnyDelay && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-900">Forsinkelser på ruten</p>
            <p className="text-xs text-amber-700 mt-1">
              Total forsinkelse: {totalDelay} minutter. Ankomsttid er oppdatert.
            </p>
          </div>
        </motion.div>
      )}

      {/* Route timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-4">
          {routeDestinations.map((dest, index) => {
            const isFirst = index === 0;
            const isLast = index === routeDestinations.length - 1;
            const transportMode = !isLast ? route.transportModes[index] : null;
            const legTime = !isLast ? Math.floor(route.totalTime / (routeDestinations.length - 1)) : 0;

            return (
              <React.Fragment key={dest.id}>
                {/* Destination node */}
                <DestinationItem
                  dest={dest}
                  index={index}
                  totalCount={routeDestinations.length}
                  isFirst={isFirst}
                  isLast={isLast}
                  onMoveUp={() => moveDestinationUp(index)}
                  onMoveDown={() => moveDestinationDown(index)}
                  onEdit={() => onEditDestination?.(dest)}
                />

                {/* Transport leg */}
                {!isLast && transportMode && (() => {
                  const delayInfo = transportDelays[index];
                  return (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ delay: index * 0.15 + 0.2 }}
                      className="ml-7 pl-7 border-l-2 border-dashed border-gray-300"
                      style={{ originY: 0 }}
                    >
                      <div className="flex items-center gap-3 py-2.5">
                        <motion.div 
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-lg ${
                            delayInfo.hasDelay 
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          }`}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: index * 0.15 + 0.3, type: 'spring' }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {transportMode}
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-900">
                              {legTime + delayInfo.delay} min
                            </p>
                            {delayInfo.hasDelay && (
                              <span className="text-xs text-amber-600">
                                (+{delayInfo.delay} min)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {transportMode === '🚶‍♂️' && 'Gå'}
                            {transportMode === '🚌' && 'Buss'}
                            {transportMode === '🚈' && 'Bybanen'}
                            {transportMode === '🚲' && 'Sykkel'}
                            {transportMode === '🛳️' && 'Ferge'}
                            {transportMode === '🚕' && 'Taxi'}
                          </p>
                          {delayInfo.hasDelay && (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-amber-700 mt-1 flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Forsinket grunnet {delayInfo.reason}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 space-y-2">
        {/* Ticket button */}
        <motion.button 
          onClick={() => setShowTicketOverview(true)}
          className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg active:shadow-xl active:opacity-90 transition-all flex items-center justify-center gap-2"
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
        >
          <Ticket className="w-5 h-5" />
          <span>Kjøp bilett</span>
        </motion.button>

        {/* Navigation button */}
        <motion.button 
          onClick={() => setShowMap(true)}
          className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg active:shadow-xl active:opacity-90 transition-all text-center"
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
        >
          Start navigasjon
        </motion.button>
      </div>

      {/* Ticket Overview Modal */}
      <TicketOverview
        isOpen={showTicketOverview}
        onClose={() => setShowTicketOverview(false)}
        plannedTravelTime={route.totalTime}
        onPurchaseTicket={onPurchaseTicket}
      />
    </motion.div>
  );
}
