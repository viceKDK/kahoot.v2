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
    1: 'h-64', // Más alto
    2: 'h-48',
    3: 'h-40',
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
    <div className="flex items-end justify-center gap-4 px-8 py-12">
      {orderedPodium.map((entry, index) => {
        if (!entry) return null;

        const rank = entry.rank;
        const delay = rank === 1 ? 0.4 : rank === 2 ? 0.2 : 0.6;

        return (
          <motion.div
            key={entry.player.id}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay,
              type: 'spring',
              stiffness: 100,
              damping: 15,
            }}
            className="flex flex-col items-center"
          >
            {/* Avatar y nombre */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.3, type: 'spring' }}
              className="mb-4 text-center"
            >
              <div className="relative">
                <Avatar avatar={entry.player.avatar} size="xl" />
                {/* Medalla */}
                <div className="absolute -top-2 -right-2 text-5xl">
                  {medals[rank as keyof typeof medals]}
                </div>
              </div>
              <h3 className="text-2xl font-bold mt-4 text-white text-shadow">
                {entry.player.name}
              </h3>
              <p className="text-3xl font-bold text-yellow-300 mt-2">
                {entry.player.score.toLocaleString()}
              </p>
              <p className="text-sm text-white/80">puntos</p>
            </motion.div>

            {/* Pedestal */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              transition={{ delay, duration: 0.5 }}
              className={`
                w-40 ${podiumHeights[rank as keyof typeof podiumHeights]}
                bg-gradient-to-b ${podiumColors[rank as keyof typeof podiumColors]}
                rounded-t-3xl shadow-2xl
                flex items-start justify-center pt-6
              `}
            >
              <span className="text-6xl font-bold text-white/90">{rank}</span>
            </motion.div>
          </motion.div>
        );
      })}

      {/* Confetti effect */}
      <Confetti />
    </div>
  );
}

// Componente de confetti simple
function Confetti() {
  const confettiPieces = Array.from({ length: 50 });

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: Math.random() * 720,
            opacity: 0,
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 2,
            ease: 'linear',
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][
              Math.floor(Math.random() * 5)
            ],
          }}
        />
      ))}
    </div>
  );
}
