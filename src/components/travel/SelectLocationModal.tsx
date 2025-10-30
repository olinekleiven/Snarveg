import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Coordinates {
  lat: number;
  lng: number;
}

interface SelectLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (coords: Coordinates, searchedText?: string) => void;
}

export default function SelectLocationModal({ isOpen, onClose, onNext }: SelectLocationModalProps) {
  const [search, setSearch] = useState<string>('');
  const [coords, setCoords] = useState<Coordinates | null>(null);

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lat = +(1 - y / rect.height).toFixed(6);
    const lng = +(x / rect.width).toFixed(6);
    setCoords({ lat, lng });
  };

  const handleNext = () => {
    if (!coords) return;
    onNext(coords, search.trim() || undefined);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-4 bottom-0 top-16 max-w-xl mx-auto bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Stepper (dots) - step 1/2, small and top-left */}
            <div className="px-6">
              <div className="flex items-center gap-1 select-none mb-1">
                {[1, 2].map((i) => (
                  <span
                    key={i}
                    className={`${i <= 1 ? 'bg-blue-500' : 'bg-gray-300'} w-2.5 h-2.5 rounded-full`}
                  />
                ))}
              </div>
            </div>

            <div className="px-6 pb-4">
              <h2 className="text-lg text-gray-900">Velg plassering</h2>
              <p className="text-sm text-gray-500">Søk eller klikk et sted i kart-området</p>
            </div>

            <div className="px-6 pb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Søk etter et sted..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Fake map grid - click anywhere to set a pin */}
            <div className="px-6">
              <div
                className="relative w-full aspect-[4/3] rounded-2xl border border-gray-200 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 overflow-hidden"
                onClick={handleGridClick}
              >
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-4">
                  {Array.from({ length: 24 }).map((_, idx) => (
                    <div key={idx} className="border border-white/50" />
                  ))}
                </div>
                {coords && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-full"
                    style={{ left: `${coords.lng * 100}%`, top: `${(1 - coords.lat) * 100}%` }}
                  >
                    <div className="w-4 h-4 bg-red-500 rounded-full shadow" />
                  </div>
                )}
                {!coords && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-gray-500 bg-white/70 px-3 py-1 rounded-full shadow">Klikk et sted i kartet</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3.5 rounded-xl border border-gray-200 text-gray-700 active:bg-gray-50 transition-colors"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!coords}
                className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Neste
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


