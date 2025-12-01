// ============================================================================
// JOIN GAME PAGE
// Página para que un jugador se una a una sala
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { SocketEvents, GameStatus } from '@/shared/types';
import { motion } from 'framer-motion';

export default function JoinGamePage() {
  const params = useParams();
  const router = useRouter();
  const socket = useSocket();
  const { game, currentPlayer, isConnected, setCurrentPlayer } = useGameStore();

  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  const code = (params.code as string).toUpperCase();

  // Redirect cuando el juego inicia
  useEffect(() => {
    if (game?.status === GameStatus.PLAYING && hasJoined) {
      router.push(`/game/${code}`);
    }
  }, [game?.status, code, router, hasJoined]);

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();

    // Solo comprobamos que exista instancia de socket;
    // si todavía está conectando, Socket.IO enviará el evento al conectar.
    if (!socket) {
      alert('No se pudo conectar al servidor. Recarga la página e inténtalo de nuevo.');
      return;
    }

    if (!playerName.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }

    // Listen for join response
    socket.once(SocketEvents.PLAYER_JOINED, (response) => {
      setCurrentPlayer(response.player);
      setHasJoined(true);
    });

    socket.emit(SocketEvents.PLAYER_JOIN_GAME, {
      code,
      playerName: playerName.trim(),
    });
  };

  if (hasJoined && game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-white max-w-lg w-full p-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-8xl mb-6"
          >
            ƒo.
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Estás Dentro!
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Esperando que el host inicie el juego...
          </p>
          <div className="animate-pulse-slow">
            <div className="text-6xl">ÐYZ©</div>
          </div>
          <p className="text-gray-500 mt-6">
            Jugadores conectados: {game.players.length}
          </p>
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Unirse a Sala
          </h1>
          <div className="text-6xl font-bold text-yellow-300 tracking-wider">
            {code}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleJoinGame} className="card-white p-8 space-y-6">
          <div>
            <label className="block text-lg font-bold mb-2 text-gray-900">
              Tu Nombre
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ingresa tu nombre"
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1">
              Unirse
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

