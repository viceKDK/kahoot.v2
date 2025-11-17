// ============================================================================
// RANKING LIST COMPONENT
// Muestra el ranking de jugadores con animaciones y destaca al jugador actual
// ============================================================================

'use client';

import { RankingEntry } from '@/shared/types';
import Avatar from './Avatar';
import { motion } from 'framer-motion';

interface RankingListProps {
  ranking: RankingEntry[];
  showTop?: number; // Mostrar solo top N jugadores
  showAccuracy?: boolean;
  currentPlayerId?: string; // ID del jugador actual para destacarlo
}

export default function RankingList({
  ranking,
  showTop,
  showAccuracy = false,
  currentPlayerId,
}: RankingListProps) {
  // Top N jugadores
  const topRanking = showTop ? ranking.slice(0, showTop) : ranking;

  // Encontrar al jugador actual
  const currentPlayerEntry = ranking.find(entry => entry.player.id === currentPlayerId);
  const isCurrentPlayerInTop = currentPlayerEntry && topRanking.some(entry => entry.player.id === currentPlayerId);

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const renderPlayerCard = (entry: RankingEntry, index: number, isCurrentPlayer: boolean) => (
    <motion.div
      key={entry.player.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-center gap-4 p-4 relative ${
        isCurrentPlayer
          ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border-4 border-primary rounded-2xl shadow-2xl'
          : 'card-white'
      }`}
    >
      {/* Círculo con ranking para el jugador actual */}
      {isCurrentPlayer && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute -right-3 -top-3 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl border-4 border-white z-10"
        >
          <div className="text-center">
            <div className="text-2xl font-black text-white leading-none">
              {entry.rank}
            </div>
            <div className="text-[10px] font-bold text-white/90 leading-none">
              TÚ
            </div>
          </div>
        </motion.div>
      )}

      {/* Rank */}
      <div className={`text-3xl font-bold min-w-[60px] text-center ${
        isCurrentPlayer ? 'text-primary' : ''
      }`}>
        {getMedalEmoji(entry.rank) || `#${entry.rank}`}
      </div>

      {/* Avatar */}
      <Avatar avatar={entry.player.avatar} size="md" />

      {/* Player Info */}
      <div className="flex-1">
        <h3 className={`text-xl font-bold ${isCurrentPlayer ? 'text-primary' : ''}`}>
          {entry.player.name} {isCurrentPlayer && '(Tú)'}
        </h3>
        <div className="flex items-center gap-4 mt-1">
          <span className={`text-lg font-semibold ${
            isCurrentPlayer ? 'text-primary text-2xl' : 'text-primary'
          }`}>
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
  );

  return (
    <div className="space-y-3">
      {/* Top N jugadores */}
      {topRanking.map((entry, index) =>
        renderPlayerCard(entry, index, entry.player.id === currentPlayerId)
      )}

      {/* Si el jugador actual NO está en el Top N, mostrarlo al final */}
      {currentPlayerEntry && !isCurrentPlayerInTop && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 my-4"
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <span className="text-white/60 text-sm font-semibold px-3">
              Tu Posición
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </motion.div>
          {renderPlayerCard(currentPlayerEntry, topRanking.length, true)}
        </>
      )}
    </div>
  );
}
