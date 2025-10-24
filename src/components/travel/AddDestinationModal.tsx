import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { Destination } from './types';

interface AddDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (destination: Omit<Destination, 'id' | 'position'>) => void;
}

const emojiOptions = [
  '🏛️', '☕', '🏖️', '🎵', '🌲', '🍽️', '🛍️', '🏨',
  '🎭', '🎨', '⛪', '🏰', '🎢', '🏃', '🎯', '📚',
  '🏥', '✈️', '🚇', '🎪', '🌆', '🗼', '🏞️', '⛰️'
];

const colorOptions = [
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
];

export default function AddDestinationModal({ isOpen, onClose, onAdd }: AddDestinationModalProps) {
  const [label, setLabel] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📍');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    onAdd({
      label: label.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
      address: address.trim() || undefined,
    });

    // Reset form
    setLabel('');
    setSelectedEmoji('📍');
    setSelectedColor('#3B82F6');
    setAddress('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 bottom-0 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Drag indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <h2 className="text-gray-900">Legg til destinasjon</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Name input */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Navn</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="F.eks. Bryggen"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              {/* Address input */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Adresse (valgfritt)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Bryggen, Bergen"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Emoji selector */}
              <div>
                <label className="block text-sm text-gray-600 mb-3">Velg ikon</label>
                <div className="grid grid-cols-8 gap-2">
                  {emojiOptions.map((emoji) => (
                    <motion.button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-blue-100 ring-2 ring-blue-500'
                          : 'bg-gray-50 active:bg-gray-100'
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Color selector */}
              <div>
                <label className="block text-sm text-gray-600 mb-3">Velg farge</label>
                <div className="grid grid-cols-8 gap-2">
                  {colorOptions.map((color) => (
                    <motion.button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`aspect-square rounded-full transition-all ${
                        selectedColor === color.value
                          ? 'ring-4 ring-offset-2 ring-gray-300'
                          : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <motion.div 
                className="flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl"
                layout
              >
                <div className="text-center">
                  <motion.div
                    className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl shadow-lg bg-white border-3"
                    style={{
                      borderColor: selectedColor,
                      boxShadow: `0 10px 40px -10px ${selectedColor}60`,
                    }}
                    key={selectedEmoji + selectedColor}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {selectedEmoji}
                  </motion.div>
                  <p className="text-sm text-gray-700">{label || 'Forhåndsvisning'}</p>
                </div>
              </motion.div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2 pb-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 rounded-xl border border-gray-200 text-gray-700 active:bg-gray-50 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={!label.trim()}
                  className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  Legg til
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
