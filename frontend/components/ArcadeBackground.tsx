// ============================================================================
// ARCADE BACKGROUND - NEO-ARCADE Animated Background
// Fondo animado con grid estilo retro-futurista
// ============================================================================

'use client';

import { motion } from 'framer-motion';

export default function ArcadeBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #1a0033 0%, #0a0015 50%, #000000 100%)',
        }}
      />

      {/* Animated grid */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.1) 50%, transparent 100%),
            linear-gradient(0deg, transparent 0%, rgba(255, 0, 255, 0.1) 50%, transparent 100%),
            repeating-linear-gradient(90deg, rgba(0, 255, 255, 0.03) 0px, transparent 1px, transparent 40px, rgba(0, 255, 255, 0.03) 41px),
            repeating-linear-gradient(0deg, rgba(255, 0, 255, 0.03) 0px, transparent 1px, transparent 40px, rgba(255, 0, 255, 0.03) 41px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
        }}
        animate={{
          y: [0, 40],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Glowing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(255, 0, 255, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.05) 2px, rgba(255, 255, 255, 0.05) 4px)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.8) 100%)',
        }}
      />
    </div>
  );
}
