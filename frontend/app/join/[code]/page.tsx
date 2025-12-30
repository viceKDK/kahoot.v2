// ============================================================================
// JOIN GAME PAGE
// Página para que un jugador se una a una sala - Restaurada
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { SocketEvents, GameStatus } from '@/shared/types';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export default function JoinGamePage() {
  const params = useParams();
  const router = useRouter();
  const socket = useSocket();
  const { user } = useAuth();
  const { game, currentPlayer, setCurrentPlayer } = useGameStore();

  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  const code = (params.code as string).toUpperCase();

  useEffect(() => {
    if (game?.status === GameStatus.PLAYING && hasJoined) {
      router.push(`/game/${code}`);
    }
  }, [game?.status, code, router, hasJoined]);

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) return;
    if (!playerName.trim()) return alert('Nombre obligatorio');

    socket.once(SocketEvents.PLAYER_JOINED, (response) => {
      setCurrentPlayer(response.player);
      setHasJoined(true);
    });

    socket.emit(SocketEvents.PLAYER_JOIN_GAME, {
      code,
      playerName: playerName.trim(),
      supabaseUserId: user?.id,
    });
  };

  if (hasJoined && game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-white max-w-2xl w-full p-12 text-center shadow-2xl"
        >
          <h1 className="text-6xl font-bold text-primary mb-4">{currentPlayer?.name}</h1>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">¡Estás Dentro!</h2>
          <p className="text-xl text-gray-600">Esperando al host...</p>
          <div className="mt-8 bg-gray-50 rounded-2xl p-6">
            <p className="text-gray-500 font-bold mb-4">{game.players.length} jugadores en la sala</p>
            <div className="grid grid-cols-2 gap-2">
              {game.players.map(p => (
                <div key={p.id} className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm font-bold">
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Unirse a Sala</h1>
          <div className="text-6xl font-black text-yellow-300 tracking-widest">{code}</div>
        </div>

        <form onSubmit={handleJoinGame} className="card-white p-8 space-y-6 shadow-2xl">
          <div>
            <label className="block text-lg font-bold mb-2">Tu Nombre</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nickname"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-900 text-center text-xl font-bold focus:outline-none"
            />
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => router.push('/')} className="flex-1 py-3 bg-gray-200 rounded-xl font-bold">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg">Unirse</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
