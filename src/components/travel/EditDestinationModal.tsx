import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, FileText, Plus, Trash2 } from 'lucide-react';
import { Destination } from './types';

interface EditDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (destination: Destination) => void;
  onDelete?: () => void;
  onClear?: () => void; // New prop for "Tøm node"
  destination: Destination | null;
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

export default function EditDestinationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  onClear,
  destination 
}: EditDestinationModalProps) {
  const [label, setLabel] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📍');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notes, setNotes] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);

  useEffect(() => {
    if (destination) {
      setLabel(destination.label);
      setSelectedEmoji(destination.emoji);
      setSelectedColor(destination.color);
      setAddress(destination.address || '');
      setLatitude(destination.coordinates?.lat?.toString() || '');
      setLongitude(destination.coordinates?.lng?.toString() || '');
      setNotes(destination.notes || '');
      setVisitTime(destination.visitTime || '');
      
      // Konverter customFields fra objekt til array
      const fields = destination.customFields 
        ? Object.entries(destination.customFields).map(([key, value]) => ({ key, value }))
        : [];
      setCustomFields(fields);
    }
  }, [destination]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !destination) return;

    // Konverter customFields tilbake til objekt
    const customFieldsObject = customFields.reduce((acc, field) => {
      if (field.key.trim()) {
        acc[field.key.trim()] = field.value;
      }
      return acc;
    }, {} as Record<string, string>);

    const updatedDestination: Destination = {
      ...destination,
      label: label.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
      address: address.trim() || undefined,
      coordinates: latitude && longitude ? {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      } : undefined,
      notes: notes.trim() || undefined,
      visitTime: visitTime || undefined,
      customFields: Object.keys(customFieldsObject).length > 0 ? customFieldsObject : undefined,
      isEmpty: false, // Node is no longer empty after being filled
    };

    onSave(updatedDestination);
    onClose();
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', newValue: string) => {
    const updated = [...customFields];
    updated[index][field] = newValue;
    setCustomFields(updated);
  };

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
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
                    placeholder="F.eks. Bryggen"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

                {/* Coordinates */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Koordinater (for API)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="Breddegrad"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="Lengdegrad"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Brukes for Google Maps API integrasjon</p>
                </div>

                {/* Visit time */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Besøkstidspunkt</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
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

                {/* Custom fields */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm text-gray-600">Egendefinerte felt</label>
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Legg til felt
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customFields.map((field, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                          placeholder="Feltnavn"
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                          placeholder="Verdi"
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomField(index)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {customFields.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        Ingen tilleggsfelt lagt til
                      </p>
                    )}
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
                        boxShadow: `0 10px 40px -10px ${selectedColor}60`,
                      }}
                      key={selectedEmoji + selectedColor}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="filter drop-shadow-sm">{selectedEmoji}</div>
                    </motion.div>
                    <p className="text-sm text-gray-700">{label || 'Forhåndsvisning'}</p>
                  </div>
                </motion.div>
              </div>
            </form>

            {/* Buttons - fixed at bottom */}
            <div className="border-t border-gray-100 p-6 bg-white">
              <div className="flex gap-3">
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete();
                      onClose();
                    }}
                    className="px-4 py-3.5 rounded-xl border border-red-200 text-red-600 active:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                {/* "Tøm node" button - only show if node has content and is not the center node */}
                {onClear && destination && !destination.isCenter && (
                  <button
                    type="button"
                    onClick={() => {
                      onClear();
                      onClose();
                    }}
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
                  disabled={!label.trim()}
                  className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  Lagre
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
