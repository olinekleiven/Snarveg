import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, FootprintsIcon as Walking, CloudRain, Sun, Timer, Wallet, Leaf, ArrowRight, Check } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (preferences: UserPreferences) => void;
}

export interface UserPreferences {
  transportVsWalking: 'transport' | 'walking' | 'balanced';
  weatherPreference: 'avoid-rain' | 'dont-mind' | 'love-rain';
  priority: 'speed' | 'price' | 'eco';
  transfers: 'minimize' | 'dont-mind';
}

interface Question {
  id: keyof UserPreferences;
  question: string;
  description: string;
  options: Array<{
    value: string;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    gradient: string;
  }>;
}

const questions: Question[] = [
  {
    id: 'transportVsWalking',
    question: 'Hvordan vil du reise?',
    description: 'Velg om du foretrekker å ta buss/bane, eller om du heller går litt ekstra',
    options: [
      {
        value: 'transport',
        label: 'Kollektivt',
        sublabel: 'Jeg tar heller buss, selv om det tar 5 min ekstra',
        icon: <Bus className="w-8 h-8" />,
        gradient: 'from-blue-400 to-blue-600',
      },
      {
        value: 'balanced',
        label: 'Balansert',
        sublabel: 'Jeg velger det som passer best til situasjonen',
        icon: <div className="flex gap-1"><Bus className="w-6 h-6" /><Walking className="w-6 h-6" /></div>,
        gradient: 'from-purple-400 to-indigo-600',
      },
      {
        value: 'walking',
        label: 'Gåing',
        sublabel: 'Jeg går heller enn å ta kollektivt',
        icon: <Walking className="w-8 h-8" />,
        gradient: 'from-green-400 to-emerald-600',
      },
    ],
  },
  {
    id: 'weatherPreference',
    question: 'Hva synes du om regn?',
    description: 'Skal vi prøve å unngå gåing i regnet, eller gjør det ingenting?',
    options: [
      {
        value: 'avoid-rain',
        label: 'Unngå regn',
        sublabel: 'Prioriter innendørs/overdekte ruter når det regner',
        icon: <CloudRain className="w-8 h-8" />,
        gradient: 'from-slate-400 to-gray-600',
      },
      {
        value: 'dont-mind',
        label: 'Gjør ingenting',
        sublabel: 'Jeg har paraply eller regntøy',
        icon: <div className="flex gap-1"><CloudRain className="w-6 h-6" /><Sun className="w-6 h-6" /></div>,
        gradient: 'from-blue-400 to-cyan-500',
      },
      {
        value: 'love-rain',
        label: 'Liker regn',
        sublabel: 'Regn er koselig, ingen problem!',
        icon: <Sun className="w-8 h-8" />,
        gradient: 'from-yellow-400 to-orange-500',
      },
    ],
  },
  {
    id: 'priority',
    question: 'Hva er viktigst for deg?',
    description: 'Velg hovedprioritet når vi foreslår reiseruter',
    options: [
      {
        value: 'speed',
        label: 'Raskest mulig',
        sublabel: 'Tid er viktigere enn pris',
        icon: <Timer className="w-8 h-8" />,
        gradient: 'from-red-400 to-pink-600',
      },
      {
        value: 'price',
        label: 'Billigst',
        sublabel: 'Jeg vil spare penger på reisen',
        icon: <Wallet className="w-8 h-8" />,
        gradient: 'from-emerald-400 to-green-600',
      },
      {
        value: 'eco',
        label: 'Miljøvennlig',
        sublabel: 'Klimaavtrykk er viktig for meg',
        icon: <Leaf className="w-8 h-8" />,
        gradient: 'from-teal-400 to-cyan-600',
      },
    ],
  },
  {
    id: 'transfers',
    question: 'Hva med bytter underveis?',
    description: 'Hvor mange ganger er du villig til å bytte buss/bane?',
    options: [
      {
        value: 'minimize',
        label: 'Færrest mulig',
        sublabel: 'Jeg vil helst ha direkte ruter',
        icon: <Check className="w-8 h-8" />,
        gradient: 'from-indigo-400 to-purple-600',
      },
      {
        value: 'dont-mind',
        label: 'Gjør ingenting',
        sublabel: 'Jeg bytter gjerne om ruten blir bedre',
        icon: <ArrowRight className="w-8 h-8" />,
        gradient: 'from-blue-400 to-indigo-600',
      },
    ],
  },
];

// Animation constants
const ANIMATION_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const TRANSITION_CONFIG = {
  x: { type: 'spring' as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
};

const AUTO_ADVANCE_DELAY = 800; // Slightly faster transitions between steps

// Background animation constants
const BG_ORB_1_ANIMATE = {
  scale: [1, 1.2, 1],
  opacity: [0.3, 0.5, 0.3],
};

const BG_ORB_1_TRANSITION = {
  duration: 8,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const BG_ORB_2_ANIMATE = {
  scale: [1.2, 1, 1.2],
  opacity: [0.5, 0.3, 0.5],
};

const BG_ORB_2_TRANSITION = {
  duration: 10,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const PROGRESS_TRANSITION = {
  duration: 0.5,
  ease: 'easeOut' as const,
};

const SELECTED_BG_TRANSITION = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
  const [direction, setDirection] = useState(1);

  // Memoize current question and progress
  const currentQuestion = useMemo(() => questions[currentStep], [currentStep]);
  const progress = useMemo(
    () => ((currentStep + 1) / questions.length) * 100,
    [currentStep]
  );

  const handleSelect = useCallback((value: string) => {
    setPreferences(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    // Auto-advance after selection ONLY if not on last step
    // On last step, user must click "Ferdig!" button manually
    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setDirection(1);
        setCurrentStep(prev => prev + 1);
      }, AUTO_ADVANCE_DELAY);
    }
  }, [currentQuestion.id, currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    onComplete(preferences as UserPreferences);
  }, [preferences, onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-y-auto">
      {/* Animated background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"
          animate={BG_ORB_1_ANIMATE}
          transition={BG_ORB_1_TRANSITION}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"
          animate={BG_ORB_2_ANIMATE}
          transition={BG_ORB_2_TRANSITION}
        />
      </div>

      {/* Content */}
      <div className="relative min-h-full flex flex-col p-6 pt-12 pb-6 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl text-gray-900 mb-2">Velkommen til</h1>
            <div className="text-4xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Snarveg
            </div>
          </motion.div>

          {/* Progress bar */}
          <div className="relative h-2 bg-white/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={PROGRESS_TRANSITION}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Spørsmål {currentStep + 1} av {questions.length}
          </p>
        </div>

        {/* Question card */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={ANIMATION_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION_CONFIG}
              className="flex-1 flex flex-col"
            >
              <div className="mb-6">
                <h2 className="text-2xl text-gray-900 mb-2">
                  {currentQuestion.question}
                </h2>
                <p className="text-gray-600">
                  {currentQuestion.description}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 flex-1">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = preferences[currentQuestion.id] === option.value;
                  
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`w-full p-5 rounded-2xl transition-all relative overflow-hidden ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-lg'
                          : 'bg-white/70 backdrop-blur-sm shadow-md hover:shadow-lg active:scale-[0.98]'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Gradient background when selected */}
                      {isSelected && (
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${option.gradient}`}
                          layoutId="selectedBackground"
                          transition={SELECTED_BG_TRANSITION}
                        />
                      )}

                      <div className="relative flex items-center gap-4">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : `bg-gradient-to-br ${option.gradient} text-white`
                          }`}
                        >
                          {option.icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 text-left">
                          <p className={`mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {option.label}
                          </p>
                          <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
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
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          {currentStep > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleBack}
              className="px-6 py-3 bg-white/70 backdrop-blur-sm text-gray-700 rounded-xl shadow-md"
              whileTap={{ scale: 0.95 }}
            >
              Tilbake
            </motion.button>
          )}
          
          {currentStep === questions.length - 1 && preferences[currentQuestion.id] && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleComplete}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg"
              whileTap={{ scale: 0.95 }}
            >
              Ferdig
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
