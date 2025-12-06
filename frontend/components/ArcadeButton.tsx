// ============================================================================
// ARCADE BUTTON - NEO-ARCADE Component
// Botón estilo máquina arcade con efectos visuales
// ============================================================================

'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ArcadeButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const variantStyles = {
  primary: {
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    shadow: '0 0 20px rgba(102, 126, 234, 0.6), 0 0 40px rgba(118, 75, 162, 0.4)',
    hoverShadow: '0 0 30px rgba(102, 126, 234, 0.8), 0 0 60px rgba(118, 75, 162, 0.6)',
    border: '#8b9af7',
  },
  success: {
    bg: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    shadow: '0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 204, 106, 0.4)',
    hoverShadow: '0 0 30px rgba(0, 255, 136, 0.8), 0 0 60px rgba(0, 204, 106, 0.6)',
    border: '#33ffaa',
  },
  danger: {
    bg: 'linear-gradient(135deg, #ff0066 0%, #cc0044 100%)',
    shadow: '0 0 20px rgba(255, 0, 102, 0.6), 0 0 40px rgba(204, 0, 68, 0.4)',
    hoverShadow: '0 0 30px rgba(255, 0, 102, 0.8), 0 0 60px rgba(204, 0, 68, 0.6)',
    border: '#ff3388',
  },
  warning: {
    bg: 'linear-gradient(135deg, #ffaa00 0%, #ff8800 100%)',
    shadow: '0 0 20px rgba(255, 170, 0, 0.6), 0 0 40px rgba(255, 136, 0, 0.4)',
    hoverShadow: '0 0 30px rgba(255, 170, 0, 0.8), 0 0 60px rgba(255, 136, 0, 0.6)',
    border: '#ffbb33',
  },
};

const sizeStyles = {
  sm: 'px-6 py-2 text-lg',
  md: 'px-8 py-3 text-xl',
  lg: 'px-12 py-4 text-2xl',
};

export default function ArcadeButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: ArcadeButtonProps) {
  const style = variantStyles[variant];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative font-black uppercase tracking-wider rounded-xl
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        background: style.bg,
        border: `4px solid ${style.border}`,
        boxShadow: style.shadow,
        fontFamily: '"Rajdhani", "Bebas Neue", sans-serif',
        color: '#ffffff',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      }}
      whileHover={!disabled ? {
        scale: 1.05,
        boxShadow: style.hoverShadow,
      } : {}}
      whileTap={!disabled ? {
        scale: 0.95,
      } : {}}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
    >
      {/* Efecto de brillo superior */}
      <div
        className="absolute inset-0 rounded-lg opacity-40"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Contenido */}
      <span className="relative z-10">{children}</span>

      {/* Scanline effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
        animate={{
          y: [0, -8],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.button>
  );
}
