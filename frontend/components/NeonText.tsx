// ============================================================================
// NEON TEXT - NEO-ARCADE Typography Component
// Texto con efecto de neón brillante
// ============================================================================

'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface NeonTextProps {
  children: ReactNode;
  color?: 'cyan' | 'magenta' | 'yellow' | 'green' | 'red';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  flicker?: boolean;
}

const colorMap = {
  cyan: {
    text: '#00ffff',
    shadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff, 0 0 40px #00d4ff, 0 0 70px #00d4ff, 0 0 80px #00d4ff',
  },
  magenta: {
    text: '#ff00ff',
    shadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff, 0 0 40px #d400d4, 0 0 70px #d400d4, 0 0 80px #d400d4',
  },
  yellow: {
    text: '#ffff00',
    shadow: '0 0 10px #ffff00, 0 0 20px #ffff00, 0 0 30px #ffff00, 0 0 40px #d4d400, 0 0 70px #d4d400, 0 0 80px #d4d400',
  },
  green: {
    text: '#00ff88',
    shadow: '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88, 0 0 40px #00d46a, 0 0 70px #00d46a, 0 0 80px #00d46a',
  },
  red: {
    text: '#ff0066',
    shadow: '0 0 10px #ff0066, 0 0 20px #ff0066, 0 0 30px #ff0066, 0 0 40px #d40054, 0 0 70px #d40054, 0 0 80px #d40054',
  },
};

const sizeMap = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-7xl',
  '2xl': 'text-8xl',
  '3xl': 'text-9xl',
};

export default function NeonText({
  children,
  color = 'cyan',
  size = 'lg',
  className = '',
  flicker = false
}: NeonTextProps) {
  const colorStyle = colorMap[color];

  return (
    <motion.div
      className={`font-black tracking-wider uppercase ${sizeMap[size]} ${className}`}
      style={{
        color: colorStyle.text,
        textShadow: colorStyle.shadow,
        fontFamily: '"Orbitron", "Rajdhani", "Bebas Neue", sans-serif',
        WebkitTextStroke: '2px rgba(0,0,0,0.3)',
      }}
      animate={flicker ? {
        opacity: [1, 0.8, 1, 0.9, 1],
        textShadow: [
          colorStyle.shadow,
          colorStyle.shadow.replace(/\d+px/g, (match) => `${parseInt(match) * 0.7}px`),
          colorStyle.shadow,
          colorStyle.shadow.replace(/\d+px/g, (match) => `${parseInt(match) * 0.9}px`),
          colorStyle.shadow,
        ],
      } : {}}
      transition={{
        duration: 0.3,
        repeat: flicker ? Infinity : 0,
        repeatDelay: Math.random() * 3 + 2,
      }}
    >
      {children}
    </motion.div>
  );
}
