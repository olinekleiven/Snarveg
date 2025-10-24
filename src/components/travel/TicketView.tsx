import React from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Clock, Calendar, Ticket, QrCode, ArrowRight } from 'lucide-react';
import { Route, Destination } from './types';

interface TicketViewProps {
  route: Route;
  destinations: Destination[];
  onClose: () => void;
}

export default function TicketView({ route, destinations, onClose }: TicketViewProps) {
  const routeDestinations = route.destinations
    .map(id => destinations.find(d => d.id === id))
    .filter(Boolean) as Destination[];

  const startPoint = routeDestinations[0];
  const endPoint = routeDestinations[routeDestinations.length - 1];
  
  // Simulate ticket data
  const ticketNumber = `SNV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const currentDate = new Date();
  const departureTime = `${currentDate.getHours()}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  const arrivalTime = `${currentDate.getHours()}:${String(currentDate.getMinutes() + route.totalTime).padStart(2, '0')}`;
  const dateStr = currentDate.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Calculate price based on distance and transport modes
  const basePrice = 45;
  const pricePerKm = 8;
  const totalPrice = Math.round(basePrice + (route.totalDistance * pricePerKm));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
      >
        {/* Close button */}
        <motion.button
          onClick={onClose}
          className="ml-auto mb-3 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-5 h-5 text-gray-700" />
        </motion.button>

        {/* Ticket Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-6 pb-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Ticket className="w-6 h-6 text-white" />
                  <h2 className="text-white">Snarveg Bilett</h2>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <p className="text-xs text-white">Gyldig</p>
                </div>
              </div>
              
              <p className="text-blue-100 text-sm mb-1">Billettnummer</p>
              <p className="text-white tracking-wider">{ticketNumber}</p>
            </div>
          </div>

          {/* Punched edge effect */}
          <div className="flex justify-between items-center -mt-4 px-4 relative z-10">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-full -ml-4 border-4 border-white shadow-inner" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2" />
            <div className="w-8 h-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-full -mr-4 border-4 border-white shadow-inner" />
          </div>

          {/* Ticket body */}
          <div className="p-6 pt-4 space-y-5">
            {/* Route info */}
            <div>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: startPoint.color }}
                    />
                    <p className="text-xs text-gray-500">Fra</p>
                  </div>
                  <p className="text-gray-900">{startPoint.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{departureTime}</p>
                </div>

                <div className="flex-shrink-0 mt-6">
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full p-2">
                    <ArrowRight className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>

                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <p className="text-xs text-gray-500">Til</p>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: endPoint.color }}
                    />
                  </div>
                  <p className="text-gray-900">{endPoint.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{arrivalTime}</p>
                </div>
              </div>

              {/* Travel info */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{route.totalTime} min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{route.totalDistance} km</span>
                </div>
                <div className="flex gap-1">
                  {route.transportModes.slice(0, 3).map((mode, idx) => (
                    <div
                      key={idx}
                      className="text-lg"
                    >
                      {mode}
                    </div>
                  ))}
                  {route.transportModes.length > 3 && (
                    <span className="text-sm text-gray-500">+{route.transportModes.length - 3}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
              <Calendar className="w-4 h-4" />
              <span>{dateStr}</span>
            </div>

            {/* Stops */}
            {routeDestinations.length > 2 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Stopp underveis ({routeDestinations.length - 2})</p>
                <div className="flex flex-wrap gap-2">
                  {routeDestinations.slice(1, -1).map((dest, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{dest.emoji}</span>
                      <span className="text-xs text-gray-700">{dest.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code placeholder */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center">
              <div className="w-32 h-32 bg-white rounded-xl shadow-inner flex items-center justify-center mb-3 border-2 border-gray-200">
                <QrCode className="w-20 h-20 text-gray-300" />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Skann QR-koden ved ombordstigning
              </p>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
              <span className="text-gray-600">Total pris</span>
              <div className="text-right">
                <p className="text-2xl text-gray-900">{totalPrice} kr</p>
                <p className="text-xs text-gray-500">inkl. mva</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500">
              Billetten er gyldig i 2 timer fra første ombordstigning
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-3">
          <motion.button
            onClick={onClose}
            className="flex-1 bg-white/90 backdrop-blur text-gray-700 py-3.5 rounded-2xl shadow-lg"
            whileTap={{ scale: 0.98 }}
          >
            Avbryt
          </motion.button>
          <motion.button
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-2xl shadow-lg"
            whileTap={{ scale: 0.98 }}
          >
            Kjøp billett
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
