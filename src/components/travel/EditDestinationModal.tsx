import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, FileText, Trash2 } from 'lucide-react';
import { Destination } from './types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface EditDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (destination: Destination) => void;
  onDelete?: () => void;
  onClear?: () => void; // New prop for "Tøm node"
  destination: Destination | null;
  stepIndex?: number; // optional stepper support
  totalSteps?: number;
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

// Animation constants
const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

const PREVIEW_TRANSITION = {
  type: 'spring' as const,
  stiffness: 300,
};

function EditDestinationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  onClear,
  destination,
  stepIndex,
  totalSteps,
}: EditDestinationModalProps) {
  const [label, setLabel] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_EMOJI);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notes, setNotes] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (destination) {
      // If destination is empty ("Legg til sted"), show empty label so placeholder is visible
      const displayLabel = (destination.isEmpty || destination.label === 'Legg til sted') ? '' : destination.label;
      setLabel(displayLabel);
      setSelectedEmoji(destination.emoji);
      setSelectedColor(destination.color);
      
      // Pre-fill address with default only if coordinates exist (from map pinning) but no address is set
      // If user goes directly to edit modal without pinning, address should be empty
      const defaultAddress = destination.coordinates && !destination.address 
        ? 'Eksempelveien 7, 5015 Bergen' 
        : (destination.address || '');
      setAddress(defaultAddress);
      
      setLatitude(destination.coordinates?.lat?.toString() || '');
      setLongitude(destination.coordinates?.lng?.toString() || '');
      setNotes(destination.notes || '');
      setVisitTime(destination.visitTime || '');
    }
  }, [destination]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const trimmedLabel = label.trim();
    if (!trimmedLabel || !destination) return;

    const updatedDestination: Destination = {
      ...destination,
      label: trimmedLabel,
      emoji: selectedEmoji,
      color: selectedColor,
      address: address.trim() || undefined,
      coordinates: latitude && longitude ? {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      } : undefined,
      notes: notes.trim() || undefined,
      visitTime: visitTime || undefined,
      isEmpty: false, // Node is no longer empty after being filled
    };

    onSave(updatedDestination);
    onClose();
  }, [label, selectedEmoji, selectedColor, address, latitude, longitude, notes, visitTime, destination, onSave, onClose]);

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

  const handleClearClick = useCallback(() => {
    if (onClear) {
      onClear();
      onClose();
    }
  }, [onClear, onClose]);

  const handleDeleteConfirm = useCallback(() => {
    if (onDelete) {
      onDelete();
      onClose();
    }
    setShowDeleteConfirm(false);
  }, [onDelete, onClose]);

  // Memoize step dots array
  const stepDots = useMemo(() => {
    if (!totalSteps) return [];
    return Array.from({ length: totalSteps });
  }, [totalSteps]);

  if (!destination) return null;

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
            className="fixed inset-x-4 bottom-0 top-16 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SPRING_TRANSITION}
          >
            {/* Drag indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <h2 className="text-gray-900">Rediger destinasjon</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Optional stepper (dots) */}
            {stepIndex && totalSteps && (
              <div className="px-6 mt-3">
                <div className="flex items-center gap-1 select-none mb-1">
                  {stepDots.map((_, i) => (
                    <span
                      key={i}
                      className={`${i < stepIndex ? 'bg-blue-500' : 'bg-gray-300'} w-2.5 h-2.5 rounded-full`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                {/* Name input */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Navn</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={destination?.isEmpty || destination?.label === 'Legg til sted' ? 'Legg til sted' : 'F.eks. Bryggen'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    autoFocus
                  />
                </div>

                {/* Address input */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Adresse</label>
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


                {/* Notes */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Notater</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tilleggsinfo, ønsker, huskeliste..."
                      rows={3}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
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
                      className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl shadow-lg"
                      style={{
                        backgroundColor: selectedColor,
                        boxShadow: previewBoxShadow,
                      }}
                      key={selectedEmoji + selectedColor}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={PREVIEW_TRANSITION}
                    >
                      <div className="filter drop-shadow-sm">{selectedEmoji}</div>
                    </motion.div>
                    <p className="text-sm text-gray-700">{previewLabel}</p>
                  </div>
                </motion.div>
              </div>
            </form>

            {/* Buttons - fixed at bottom */}
            <div className="border-t border-gray-100 p-6 bg-white space-y-3">
              {/* Slett node button - only show if not center node and node is already saved (not a new empty node) */}
              {onDelete && destination && !destination.isCenter && !destination.isEmpty && destination.label !== 'Legg til sted' && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-6 py-3.5 rounded-xl border-2 border-red-300 bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Trash2 className="w-5 h-5" />
                  Slett node
                </button>
              )}
              
              <div className="flex gap-3">
                {/* "Tøm node" button - only show if node has content, is not the center node, and is already saved */}
                {onClear && destination && !destination.isCenter && !destination.isEmpty && destination.label !== 'Legg til sted' && (
                  <button
                    type="button"
                    onClick={handleClearClick}
                    className="px-4 py-3.5 rounded-xl border border-orange-200 text-orange-600 active:bg-orange-50 transition-colors"
                    title="Tøm node"
                  >
                    ↻
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 rounded-xl border border-gray-200 text-gray-700 active:bg-gray-50 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  Lagre
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
      
      {/* Simple delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-sm p-6 bg-white border-2 border-gray-200 shadow-xl">
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
            </div>
            
            {/* Title */}
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900 mb-1">
                Slett destinasjon?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-700">
                Denne handlingen kan ikke angres.
              </AlertDialogDescription>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            <AlertDialogCancel className="flex-1 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Slett
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
}

export default React.memo(EditDestinationModal);
