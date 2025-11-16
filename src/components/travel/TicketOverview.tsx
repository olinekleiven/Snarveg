import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, Clock, Calendar, CheckCircle2, ShoppingCart, Sparkles } from 'lucide-react';

interface TicketOverviewProps {
  isOpen: boolean;
  onClose: () => void;
  plannedTravelTime?: number; // in minutes
  onPurchaseTicket?: (ticketType: string, duration: number, price: number) => void;
}

interface TicketOption {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  recommended?: boolean;
  description: string;
}

const ticketOptions: TicketOption[] = [
  {
    id: 'single',
    name: 'Enkeltbillett',
    duration: 90,
    price: 45,
    description: 'Gyldig i 90 minutter',
  },
  {
    id: 'single-youth',
    name: 'Enkeltbillett ungdom',
    duration: 90,
    price: 35,
    description: 'Gyldig i 90 minutter (under 18 år)',
  },
  {
    id: '24h',
    name: '24-timers billett',
    duration: 1440,
    price: 120,
    description: 'Ubegrenset reising i 24 timer',
  },
  {
    id: '24h-youth',
    name: '24-timers billett ungdom',
    duration: 1440,
    price: 85,
    description: 'Ubegrenset reising i 24 timer (under 18 år)',
  },
  {
    id: '7day',
    name: '7-dagers billett',
    duration: 10080,
    price: 350,
    description: 'Ubegrenset reising i 7 dager',
  },
  {
    id: '7day-youth',
    name: '7-dagers billett ungdom',
    duration: 10080,
    price: 250,
    description: 'Ubegrenset reising i 7 dager (under 18 år)',
  },
  {
    id: '30day',
    name: '30-dagers billett',
    duration: 43200,
    price: 850,
    description: 'Ubegrenset reising i 30 dager',
  },
  {
    id: '30day-youth',
    name: '30-dagers billett ungdom',
    duration: 43200,
    price: 550,
    description: 'Ubegrenset reising i 30 dager (under 18 år)',
  },
  {
    id: 'student-semester',
    name: 'Studentbillett semester',
    duration: 129600, // ~90 dager
    price: 1200,
    description: 'Ubegrenset reising hele semesteret (90 dager)',
  },
  {
    id: 'senior',
    name: 'Honnørbillett',
    duration: 1440,
    price: 90,
    description: '24-timers billett for pensjonister (67+ år)',
  },
];

export default function TicketOverview({ isOpen, onClose, plannedTravelTime, onPurchaseTicket }: TicketOverviewProps) {
  const [selectedTicket, setSelectedTicket] = useState<TicketOption | null>(null);
  const [activeTicket, setActiveTicket] = useState<{
    type: string;
    expiresAt: Date;
    price: number;
  } | null>(() => {
    // Check localStorage for active ticket
    const saved = localStorage.getItem('snarveg_active_ticket');
    if (saved) {
      const ticket = JSON.parse(saved);
      const expiresAt = new Date(ticket.expiresAt);
      if (expiresAt > new Date()) {
        return ticket;
      } else {
        localStorage.removeItem('snarveg_active_ticket');
      }
    }
    return null;
  });

  // Get recommended ticket based on travel time
  const getRecommendedTicket = () => {
    if (!plannedTravelTime) return null;
    
    // If travel is under 60 minutes, recommend single ticket
    if (plannedTravelTime <= 60) {
      return ticketOptions.find(t => t.id === 'single');
    }
    // If travel is 60-120 minutes, recommend 24h ticket
    else if (plannedTravelTime <= 120) {
      return ticketOptions.find(t => t.id === '24h');
    }
    // Otherwise recommend based on duration
    return ticketOptions.find(t => t.id === '24h');
  };

  const recommendedTicket = getRecommendedTicket();

  const handleTicketSelect = (ticket: TicketOption) => {
    setSelectedTicket(ticket);
  };

  const handleConfirmPurchase = () => {
    if (!selectedTicket) return;
    
    const expiresAt = new Date(Date.now() + selectedTicket.duration * 60 * 1000);
    const newTicket = {
      type: selectedTicket.name,
      expiresAt,
      price: selectedTicket.price,
    };
    
    // Close confirmation modal first for smooth transition
    setSelectedTicket(null);
    
    // Update active ticket with smooth animation
    setTimeout(() => {
      setActiveTicket(newTicket);
      localStorage.setItem('snarveg_active_ticket', JSON.stringify(newTicket));
      
      if (onPurchaseTicket) {
        onPurchaseTicket(selectedTicket.id, selectedTicket.duration, selectedTicket.price);
      }
    }, 300); // Small delay for smooth modal close animation
  };

  const handleCancelPurchase = () => {
    setSelectedTicket(null);
  };

  const getTimeRemaining = () => {
    if (!activeTicket) return null;
    
    const now = new Date();
    const expires = new Date(activeTicket.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) {
      setActiveTicket(null);
      localStorage.removeItem('snarveg_active_ticket');
      return null;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  };

  const timeRemaining = getTimeRemaining();

  return (
    <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center"
            onClick={onClose}
          >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <Ticket className="w-7 h-7" />
              <div>
                <h2 className="text-2xl">Billetter</h2>
                <p className="text-sm text-blue-100">Kjøp eller vis aktiv billett</p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Active ticket */}
            {activeTicket && timeRemaining && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="text-green-900">Aktiv billett</h3>
                      <p className="text-sm text-green-700">{activeTicket.type}</p>
                    </div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full">
                    <p className="text-xs text-green-800">Gyldig</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white/50 rounded-xl p-4">
                  <Clock className="w-5 h-5 text-green-700" />
                  <div className="flex-1">
                    <p className="text-sm text-green-700">Utløper om</p>
                    <p className="text-green-900">
                      {timeRemaining.hours > 0 && `${timeRemaining.hours} t `}
                      {timeRemaining.minutes} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-700">Pris</p>
                    <p className="text-green-900">{activeTicket.price} kr</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recommendation banner - only show if we have a planned route */}
            {plannedTravelTime && plannedTravelTime > 0 && recommendedTicket && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h3 className="text-gray-900">Anbefalt billett for denne ruten</h3>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-amber-900 mb-1">Basert på din reise</p>
                      <p className="text-sm text-amber-700">
                        Du skal reise i ca. {plannedTravelTime} minutter. 
                        Vi foreslår <strong>{recommendedTicket.name}</strong> ({recommendedTicket.price} kr)
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Ticket options */}
            <div>
              <h3 className="text-gray-900 mb-4">{activeTicket ? 'Kjøp ny billett' : plannedTravelTime ? 'Alle billettalternativer' : 'Kjøp billett'}</h3>
              <div className="space-y-3">
                {ticketOptions.map((ticket, idx) => {
                  const isRecommended = recommendedTicket?.id === ticket.id && !activeTicket;
                  
                  return (
                    <motion.button
                      key={ticket.id}
                      onClick={() => handleTicketSelect(ticket)}
                      className={`w-full text-left p-5 rounded-2xl transition-all ${
                        isRecommended
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={isRecommended ? 'text-blue-900' : 'text-gray-900'}>
                              {ticket.name}
                            </p>
                            {isRecommended && (
                              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                Anbefalt
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${isRecommended ? 'text-blue-700' : 'text-gray-600'}`}>
                            {ticket.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-2xl ${isRecommended ? 'text-blue-900' : 'text-gray-900'}`}>
                            {ticket.price} kr
                          </p>
                          <ShoppingCart className={`w-5 h-5 ml-auto mt-1 ${isRecommended ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Info section */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-900 mb-1">Om billetter</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Billetter er gyldige fra kjøpstidspunkt</li>
                    <li>• Gjelder alle transportformer i Snarveg-nettverket</li>
                    <li>• Kan ikke refunderes etter aktivering</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
        )}

      {/* Purchase Confirmation Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
            onClick={handleCancelPurchase}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white p-6">
                <h3 className="text-2xl font-semibold mb-2">Bekreft kjøp</h3>
                <p className="text-blue-100 text-sm">Gjennomgå billettdetaljer før kjøp</p>
              </div>

              {/* Ticket Details */}
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{selectedTicket.name}</h4>
                    <div className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                      {selectedTicket.duration >= 1440 
                        ? `${Math.floor(selectedTicket.duration / 1440)} dager`
                        : `${selectedTicket.duration} min`}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{selectedTicket.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-gray-700 font-medium">Totalpris</span>
                    <span className="text-3xl font-bold text-gray-900">{selectedTicket.price} kr</span>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <strong>Viktig:</strong> Billetten aktiveres umiddelbart ved kjøp og kan ikke refunderes.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 flex gap-3">
                <motion.button
                  onClick={handleCancelPurchase}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                  whileTap={{ scale: 0.98 }}
                >
                  Avbryt
                </motion.button>
                <motion.button
                  onClick={handleConfirmPurchase}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg"
                  whileTap={{ scale: 0.98 }}
                >
                  Kjøp
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
