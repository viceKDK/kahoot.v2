// ============================================================================
// PODIUM COMPONENT
// Muestra el podio del Top 3 con animaciones estilo Kahoot
// ============================================================================

'use client';

import { RankingEntry } from '@/shared/types';
import Avatar from './Avatar';
import { motion } from 'framer-motion';

interface PodiumProps {
  podium: RankingEntry[]; // Top 3
}

export default function Podium({ podium }: PodiumProps) {
  // Ordenar: 2º, 1º, 3º (para mostrar el 1º en el centro más alto)
  const orderedPodium = [podium[1], podium[0], podium[2]].filter(Boolean);

  const podiumHeights = {
    1: 'h-40 sm:h-48 md:h-56 lg:h-64', // Más alto (responsive)
    2: 'h-32 sm:h-36 md:h-40 lg:h-48',
    3: 'h-28 sm:h-32 md:h-36 lg:h-40',
  };

  const podiumColors = {
    1: 'from-yellow-400 to-yellow-600',
    2: 'from-gray-300 to-gray-500',
    3: 'from-amber-600 to-amber-800',
  };

  const medals = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3 md:gap-4 px-2 sm:px-4 md:px-8 py-6 sm:py-8 md:py-12">
      {orderedPodium.map((entry, index) => {
        if (!entry) return null;

        const rank = entry.rank;
        // Secuencia de revelación tipo Kahoot: 3º → 2º → 1º (el ganador al final)
        const delay = rank === 3 ? 0.3 : rank === 2 ? 1.0 : 1.8;

        return (
          <motion.div
            key={entry.player.id}
            initial={{ opacity: 0, y: 100, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay,
              type: 'spring',
              stiffness: 120,
              damping: 12,
            }}
            className="flex flex-col items-center relative"
          >
            {/* Efecto de brillo especial para el ganador (1º lugar) */}
            {rank === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 2.5] }}
                transition={{
                  delay: delay + 0.3,
                  duration: 1,
                  ease: 'easeOut'
                }}
                className="absolute inset-0 bg-yellow-300 rounded-full blur-3xl -z-10"
              />
            )}
            {/* Avatar y nombre */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: delay + 0.4, type: 'spring', stiffness: 200 }}
              className="mb-2 sm:mb-3 md:mb-4 text-center"
            >
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + 0.5, type: 'spring', stiffness: 300 }}
                >
                  <Avatar avatar={entry.player.avatar} size={rank === 1 ? 'lg' : 'md'} />
                </motion.div>
                {/* Medalla con animación de rebote */}
                <motion.div
                  initial={{ scale: 0, rotate: -360 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: delay + 0.7,
                    type: 'spring',
                    stiffness: 300,
                    damping: 10
                  }}
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
                >
                  {medals[rank as keyof typeof medals]}
                </motion.div>
              </div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.8 }}
                className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mt-2 sm:mt-3 md:mt-4 text-white text-shadow line-clamp-1 px-1"
              >
                {entry.player.name}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.9, type: 'spring' }}
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-300 mt-1 sm:mt-2"
              >
                {entry.player.score.toLocaleString()}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 1.0 }}
                className="text-xs sm:text-sm text-white/80"
              >
                puntos
              </motion.p>
            </motion.div>

            {/* Pedestal con animación de crecimiento */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{
                delay: delay + 0.2,
                duration: 0.6,
                type: 'spring',
                stiffness: 100
              }}
              className={`
                w-20 sm:w-24 md:w-32 lg:w-40 ${podiumHeights[rank as keyof typeof podiumHeights]}
                bg-gradient-to-b ${podiumColors[rank as keyof typeof podiumColors]}
                rounded-t-2xl sm:rounded-t-3xl shadow-2xl
                flex items-start justify-center pt-3 sm:pt-4 md:pt-5 lg:pt-6
                overflow-hidden
              `}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: delay + 0.6,
                  type: 'spring',
                  stiffness: 200
                }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white/90"
              >
                {rank}
              </motion.span>
            </motion.div>
          </motion.div>
        );
      })}

      {/* Confetti effect - comienza cuando se revela el 1º lugar */}
      <Confetti startDelay={2.5} />
    </div>
  );
}

// Componente de confetti simple
function Confetti({ startDelay = 0 }: { startDelay?: number }) {
  const confettiPieces = Array.from({ length: 60 });

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {confettiPieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 500,
            y: -20,
            rotate: 0,
            opacity: 0,
          }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 20 : 1000,
            rotate: Math.random() * 720,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: startDelay + Math.random() * 2,
            ease: 'linear',
          }}
          className="absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full"
          style={{
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F4D03F'][
              Math.floor(Math.random() * 7)
            ],
          }}
        />
      ))}
    </div>
  );
}
