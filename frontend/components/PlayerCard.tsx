// ============================================================================
// PLAYER CARD COMPONENT
// Muestra información de un jugador en el lobby
// ============================================================================

'use client';

import { Player } from '@/shared/types';
import Avatar from './Avatar';
import { motion } from 'framer-motion';

interface PlayerCardProps {
  player: Player;
  index: number;
}

export default function PlayerCard({ player, index }: PlayerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card flex items-center gap-4 p-4"
    >
      <Avatar avatar={player.avatar} size="md" />
      <div className="flex-1">
        <h3 className="text-xl font-bold">{player.name}</h3>
        {player.isHost && (
          <span className="text-sm bg-yellow-400 text-gray-900 px-2 py-1 rounded-full">
            Host
          </span>
        )}
      </div>
    </motion.div>
  );
}
