import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bus, FootprintsIcon as Walking, CloudRain, Sun, Timer, Wallet, Leaf, ArrowRight, Check, Save } from 'lucide-react';
import { UserPreferences } from './OnboardingFlow';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
}

interface SettingOption {
  value: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  gradient: string;
}

interface SettingSection {
  id: keyof UserPreferences;
  title: string;
  description: string;
  options: SettingOption[];
}

const settingSections: SettingSection[] = [
  {
    id: 'transportVsWalking',
    title: 'Hvordan vil du reise?',
    description: 'Velg om du foretrekker å ta buss/bane, eller om du heller går litt ekstra',
    options: [
      {
        value: 'transport',
        label: 'Kollektivt',
        sublabel: 'Jeg tar heller buss, selv om det tar 5 min ekstra',
        icon: <Bus className="w-6 h-6" />,
        gradient: 'from-blue-400 to-blue-600',
      },
      {
        value: 'balanced',
        label: 'Balansert',
        sublabel: 'Jeg velger det som passer best til situasjonen',
        icon: <div className="flex gap-1"><Bus className="w-5 h-5" /><Walking className="w-5 h-5" /></div>,
        gradient: 'from-purple-400 to-indigo-600',
      },
      {
        value: 'walking',
        label: 'Gåing',
        sublabel: 'Jeg går heller enn å ta kollektivt',
        icon: <Walking className="w-6 h-6" />,
        gradient: 'from-green-400 to-emerald-600',
      },
    ],
  },
  {
    id: 'weatherPreference',
    title: 'Hva synes du om regn?',
    description: 'Skal vi prøve å unngå gåing i regnet, eller gjør det ingenting?',
    options: [
      {
        value: 'avoid-rain',
        label: 'Unngå regn',
        sublabel: 'Prioriter innendørs/overdekte ruter når det regner',
        icon: <CloudRain className="w-6 h-6" />,
        gradient: 'from-slate-400 to-gray-600',
      },
      {
        value: 'dont-mind',
        label: 'Gjør ingenting',
        sublabel: 'Jeg har paraply eller regntøy',
        icon: <div className="flex gap-1"><CloudRain className="w-5 h-5" /><Sun className="w-5 h-5" /></div>,
        gradient: 'from-blue-400 to-cyan-500',
      },
      {
        value: 'love-rain',
        label: 'Liker regn',
        sublabel: 'Regn er koselig, ingen problem!',
        icon: <Sun className="w-6 h-6" />,
        gradient: 'from-yellow-400 to-orange-500',
      },
    ],
  },
  {
    id: 'priority',
    title: 'Hva er viktigst for deg?',
    description: 'Velg hovedprioritet når vi foreslår reiseruter',
    options: [
      {
        value: 'speed',
        label: 'Raskest mulig',
        sublabel: 'Tid er viktigere enn pris',
        icon: <Timer className="w-6 h-6" />,
        gradient: 'from-red-400 to-pink-600',
      },
      {
        value: 'price',
        label: 'Billigst',
        sublabel: 'Jeg vil spare penger på reisen',
        icon: <Wallet className="w-6 h-6" />,
        gradient: 'from-emerald-400 to-green-600',
      },
      {
        value: 'eco',
        label: 'Miljøvennlig',
        sublabel: 'Klimaavtrykk er viktig for meg',
        icon: <Leaf className="w-6 h-6" />,
        gradient: 'from-teal-400 to-cyan-600',
      },
    ],
  },
  {
    id: 'transfers',
    title: 'Hva med bytter underveis?',
    description: 'Hvor mange ganger er du villig til å bytte buss/bane?',
    options: [
      {
        value: 'minimize',
        label: 'Færrest mulig',
        sublabel: 'Jeg vil helst ha direkte ruter',
        icon: <Check className="w-6 h-6" />,
        gradient: 'from-indigo-400 to-purple-600',
      },
      {
        value: 'dont-mind',
        label: 'Gjør ingenting',
        sublabel: 'Jeg bytter gjerne om ruten blir bedre',
        icon: <ArrowRight className="w-6 h-6" />,
        gradient: 'from-blue-400 to-indigo-600',
      },
    ],
  },
];

export default function SettingsModal({ isOpen, onClose, currentPreferences, onSave }: SettingsModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(currentPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSelect = (sectionId: keyof UserPreferences, value: string) => {
    const newPreferences = { ...preferences, [sectionId]: value };
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(preferences);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    setPreferences(currentPreferences);
    setHasChanges(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={handleCancel}
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
          <div className="sticky top-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white px-6 pt-6 pb-4 flex items-start justify-between z-10">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-semibold mb-1">Innstillinger</h2>
              <p className="text-sm text-blue-100">Tilpass appen til dine preferanser</p>
            </div>
            <motion.button
              onClick={handleCancel}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Settings content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {settingSections.map((section, sectionIdx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIdx * 0.1 }}
              >
                <div className="mb-4">
                  <h3 className="text-gray-900 mb-1">{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>

                <div className="space-y-3">
                  {section.options.map((option) => {
                    const isSelected = preferences[section.id] === option.value;
                    
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => handleSelect(section.id, option.value)}
                        className={`w-full p-4 rounded-2xl transition-all relative overflow-hidden ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-lg'
                            : 'bg-gray-50 hover:bg-gray-100 active:scale-[0.98]'
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Gradient background when selected */}
                        {isSelected && (
                          <motion.div
                            className={`absolute inset-0 bg-gradient-to-br ${option.gradient}`}
                            layoutId={`selected-${section.id}`}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}

                        <div className="relative flex items-center gap-4">
                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : `bg-gradient-to-br ${option.gradient} text-white`
                            }`}
                          >
                            {option.icon}
                          </div>

                          {/* Text */}
                          <div className="flex-1 text-left">
                            <p className={`text-sm mb-0.5 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {option.label}
                            </p>
                            <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                              {option.sublabel}
                            </p>
                          </div>

                          {/* Check icon */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-indigo-600" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer with action buttons */}
          <div 
            className="sticky bottom-0 bg-white border-t border-gray-100 p-6"
            style={{
              paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))',
            }}
          >
            <div className="flex gap-3 justify-center">
              <motion.button
                onClick={handleCancel}
                className="w-auto px-8 py-3 bg-gray-100 text-gray-700 rounded-xl text-center"
                whileTap={{ scale: 0.98 }}
              >
                Avbryt
              </motion.button>
              <motion.button
                onClick={handleSave}
                className={`w-auto px-8 py-3 rounded-xl flex items-center justify-center gap-2 ${
                  hasChanges
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-400'
                }`}
                whileTap={{ scale: hasChanges ? 0.98 : 1 }}
                disabled={!hasChanges}
              >
                <Save className="w-4 h-4" />
                Lagre
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
