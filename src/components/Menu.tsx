import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import imgRectangle6537 from "figma:asset/73a0a2712c55c814e558e14ad018e308fab9b18c.png";

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export default function Menu({ isOpen, onClose, onNavigate }: MenuProps) {
  const handleNavigation = (screen: string) => {
    onNavigate(screen);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Menu */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 400,
              mass: 0.8
            }}
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#426b1f] z-50 overflow-hidden"
          >
            {/* Background Illustration */}
            <MaskGroup />
            
            {/* Menu Items */}
            <MenuItems onNavigate={handleNavigation} />
            
            {/* Close Button */}
            <CloseButton onClick={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MaskGroup() {
  return null;
}

interface MenuItemsProps {
  onNavigate: (screen: string) => void;
}

function MenuItems({ onNavigate }: MenuItemsProps) {
  const menuItems = [
    { label: "Shop", screen: "list" },
    { label: "Newsstand", screen: "newsstand" },
    { label: "Who we are", screen: "about" },
    { label: "My Profile", screen: "profile" },
    { label: "Basket", screen: "basket" },
  ];

  return (
    <div className="absolute left-4 top-[95px]">
      <div className="box-border content-stretch flex flex-col gap-8 items-start justify-start p-0 relative">
        {menuItems.map((item) => (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            className="flex flex-col font-['Newsreader:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#ffffff] text-[26px] text-left text-nowrap tracking-[-0.52px] hover:opacity-80 transition-opacity"
          >
            <p className="adjustLetterSpacing block leading-[30px] whitespace-pre text-[36px]">
              {item.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

interface CloseButtonProps {
  onClick: () => void;
}

function CloseButton({ onClick }: CloseButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute block cursor-pointer left-[14px] overflow-visible rounded-2xl size-6 top-[35px] hover:opacity-80 transition-opacity"
    >
      <div className="absolute h-[9.5px] left-[5px] top-[5px] w-[9.6px]">
        <div className="absolute bottom-[-4.167%] left-[-4.123%] right-[-4.123%] top-[-4.167%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
            <g>
              <path
                d="M1 1.00003L13.7279 13.7279"
                stroke="var(--stroke-0, white)"
                strokeWidth="1.5"
              />
              <path
                d="M1.13605 13.7279L13.864 1"
                stroke="var(--stroke-0, white)"
                strokeWidth="1.5"
              />
            </g>
          </svg>
        </div>
      </div>
    </button>
  );
}