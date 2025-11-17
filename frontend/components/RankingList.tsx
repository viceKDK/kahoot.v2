// ============================================================================
// RANKING LIST COMPONENT
// Muestra el ranking de jugadores con animaciones
// ============================================================================

'use client';

import { RankingEntry } from '@/shared/types';
import Avatar from './Avatar';
import { motion } from 'framer-motion';

interface RankingListProps {
  ranking: RankingEntry[];
  showTop?: number; // Mostrar solo top N jugadores
  showAccuracy?: boolean;
}

export default function RankingList({
  ranking,
  showTop,
  showAccuracy = false,
}: RankingListProps) {
  const displayRanking = showTop ? ranking.slice(0, showTop) : ranking;

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="space-y-3">
      {displayRanking.map((entry, index) => (
        <motion.div
          key={entry.player.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card-white flex items-center gap-4 p-4"
        >
          {/* Rank */}
          <div className="text-3xl font-bold min-w-[60px] text-center">
            {getMedalEmoji(entry.rank) || `#${entry.rank}`}
          </div>

          {/* Avatar */}
          <Avatar avatar={entry.player.avatar} size="md" />

          {/* Player Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold">{entry.player.name}</h3>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-lg font-semibold text-primary">
                {entry.player.score.toLocaleString()} pts
              </span>
              {entry.player.streak > 0 && (
                <span className="text-sm bg-orange-400 text-white px-2 py-1 rounded-full">
                  🔥 {entry.player.streak} streak
                </span>
              )}
            </div>
            {showAccuracy && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all"
                    style={{ width: `${entry.player.accuracy}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {entry.player.accuracy}% precisión
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
