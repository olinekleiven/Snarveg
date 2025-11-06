import React from 'react';
import { Settings, RotateCcw, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopBarProps {
  onSettingsClick: () => void;
  onResetRoute?: () => void;
  hasConnections?: boolean;
  onBackClick?: () => void;
  showBackButton?: boolean;
}

export default function TopBar({ 
  onSettingsClick, 
  onResetRoute, 
  hasConnections = false,
  onBackClick,
  showBackButton = false
}: TopBarProps) {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 py-8"
    >
      <div className="px-4 flex flex-col items-center">
        <h1 className="text-5xl text-gray-900 tracking-tight text-center mb-2">Snarveg</h1>
        <p className="text-sm text-gray-600 text-center">Smart reiseplanlegging</p>
        
        {/* Back button - left side */}
        {showBackButton && onBackClick && (
          <div className="absolute left-4 top-8">
            <motion.button
              onClick={onBackClick}
              className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-700 transition-colors backdrop-blur-sm shadow-lg"
              whileTap={{ scale: 0.9 }}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </div>
        )}
        
        {/* Right side buttons */}
        <div className="absolute right-4 top-8 flex gap-2">
          {hasConnections && onResetRoute && (
            <motion.button
              onClick={onResetRoute}
              className="w-10 h-10 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center text-white transition-colors backdrop-blur-sm shadow-sm"
              whileTap={{ scale: 0.9 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
          )}
          
          <motion.button
            onClick={onSettingsClick}
            className="w-10 h-10 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center text-gray-700 transition-colors backdrop-blur-sm shadow-sm"
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
