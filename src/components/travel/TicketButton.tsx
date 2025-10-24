import React from 'react';
import { motion } from 'framer-motion';
import { Ticket } from 'lucide-react';

interface TicketButtonProps {
  hasActiveTicket: boolean;
  onClick: () => void;
}

export default function TicketButton({ hasActiveTicket, onClick }: TicketButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="relative w-12 h-12 rounded-full shadow-lg backdrop-blur-sm flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white cursor-pointer hover:shadow-xl transition-shadow"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      initial={{ x: -20, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        boxShadow: [
          '0 10px 25px rgba(59, 130, 246, 0.3)',
          '0 10px 35px rgba(99, 102, 241, 0.4)',
          '0 10px 25px rgba(59, 130, 246, 0.3)',
        ],
      }}
      transition={{ 
        delay: 0.2,
        boxShadow: { duration: 2, repeat: Infinity },
      }}
      aria-label={hasActiveTicket ? 'Vis aktiv billett' : 'Kjøp billett'}
    >
      <motion.div
        animate={{ rotate: hasActiveTicket ? 0 : [0, -5, 5, -5, 0] }}
        transition={{ duration: 0.5, repeat: hasActiveTicket ? 0 : Infinity, repeatDelay: 3 }}
      >
        <Ticket className="w-6 h-6" />
      </motion.div>
      
      {/* Pulse ring when no ticket */}
      {!hasActiveTicket && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-red-500"
          animate={{
            scale: [1, 1.5],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
      
      {/* Status indicator dot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`absolute -right-0.5 -top-0.5 w-3.5 h-3.5 rounded-full shadow-md ${
          hasActiveTicket ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        {!hasActiveTicket && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500"
            animate={{
              scale: [1, 1.8],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </motion.div>
    </motion.button>
  );
}
