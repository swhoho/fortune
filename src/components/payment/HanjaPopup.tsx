'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface HanjaPopupProps {
  hanja: string;
  meaning: string;
  source: string;
  description: string;
  children: React.ReactNode;
}

export function HanjaPopup({ hanja, meaning, source, description, children }: HanjaPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <span
        className="cursor-pointer border-b border-dashed border-[#d4af37]/50 text-[#d4af37] transition-colors hover:border-[#d4af37] hover:text-[#f3d068]"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
      </span>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-[#d4af37]/30 bg-[#1a1a1a]/95 p-4 shadow-2xl backdrop-blur-md"
          >
            <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-serif text-2xl text-white">{hanja}</span>
              <span className="text-xs font-medium text-[#d4af37]">{meaning}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                <BookOpen className="h-3 w-3" />
                <span>Source: {source}</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-300">{description}</p>
            </div>

            {/* Arrow */}
            <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[#d4af37]/30 bg-[#1a1a1a] shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
