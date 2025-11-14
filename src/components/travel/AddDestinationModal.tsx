import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { Destination } from './types';

interface AddDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (destination: Omit<Destination, 'id' | 'position'>) => void;
}

const EMOJI_OPTIONS = [
  '🏛️', '☕', '🏖️', '🎵', '🌲', '🍽️', '🛍️', '🏨',
  '🎭', '🎨', '⛪', '🏰', '🎢', '🏃', '🎯', '📚',
  '🏥', '✈️', '🚇', '🎪', '🌆', '🗼', '🏞️', '⛰️',
  '🎬', '🎸', '🏊', '⛷️', '🎮', '🍕', '⚽', '🍔'
] as const;

const COLOR_OPTIONS = [
  // Rad 1: Standardfarger (8 farger)
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  
  // Rad 2: Pastellfarger (8 farger)
  { name: 'Pastell Rosa', value: '#FBCFE8' },
  { name: 'Mint', value: '#6EE7B7' },
  { name: 'Lys Fersken', value: '#FED7AA' },
  { name: 'Lavendel', value: '#C4B5FD' },
  { name: 'Pudderblå', value: '#BFDBFE' },
  { name: 'Pastellgul', value: '#FEF3C7' },
  { name: 'Lys Turkis', value: '#A7F3D0' },
  { name: 'Lys Lilla', value: '#E9D5FF' },
] as const;

const DEFAULT_EMOJI = '📍';
const DEFAULT_COLOR = '#3B82F6';

export default function AddDestinationModal({ isOpen, onClose, onAdd }: AddDestinationModalProps) {
  const [label, setLabel] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_EMOJI);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [address, setAddress] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    onAdd({
      label: trimmedLabel,
      emoji: selectedEmoji,
      color: selectedColor,
      address: address.trim() || undefined,
    });

    // Reset form
    setLabel('');
    setSelectedEmoji(DEFAULT_EMOJI);
    setSelectedColor(DEFAULT_COLOR);
    setAddress('');
  }, [label, selectedEmoji, selectedColor, address, onAdd]);

  const isFormValid = useMemo(() => label.trim().length > 0, [label]);

  const previewLabel = useMemo(() => label || 'Forhåndsvisning', [label]);

  const previewBoxShadow = useMemo(
    () => `0 10px 40px -10px ${selectedColor}60`,
    [selectedColor]
  );

  const handleEmojiSelect = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const emoji = e.currentTarget.dataset.emoji;
    if (emoji) setSelectedEmoji(emoji);
  }, []);

  const handleColorSelect = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const color = e.currentTarget.dataset.color;
    if (color) setSelectedColor(color);
  }, []);

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
                  {EMOJI_OPTIONS.map((emoji) => {
                    const isSelected = selectedEmoji === emoji;
                    return (
                      <motion.button
                        key={emoji}
                        type="button"
                        data-emoji={emoji}
                        onClick={handleEmojiSelect}
                        className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${
                          isSelected
                            ? 'bg-blue-100 ring-2 ring-blue-500'
                            : 'bg-gray-50 active:bg-gray-100'
                        }`}
                        whileTap={{ scale: 0.9 }}
                      >
                        {emoji}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Color selector */}
              <div>
                <label className="block text-sm text-gray-600 mb-3">Velg farge</label>
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_OPTIONS.map((color) => {
                    const isSelected = selectedColor === color.value;
                    return (
                      <motion.button
                        key={color.value}
                        type="button"
                        data-color={color.value}
                        onClick={handleColorSelect}
                        className={`aspect-square rounded-full transition-all ${
                          isSelected
                            ? 'ring-4 ring-offset-2 ring-gray-300'
                            : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        whileTap={{ scale: 0.9 }}
                      />
                    );
                  })}
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
                      boxShadow: previewBoxShadow,
                    }}
                    key={selectedEmoji + selectedColor}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {selectedEmoji}
                  </motion.div>
                  <p className="text-sm text-gray-700">{previewLabel}</p>
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
                  disabled={!isFormValid}
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
