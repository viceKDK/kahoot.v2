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
          className="card-white max-w-2xl w-full p-12"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-6xl font-bold text-primary mb-4"
            >
              {currentPlayer?.name}
            </motion.h1>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              ¡Estás Dentro!
            </h2>
            <p className="text-xl text-gray-600">
              Esperando que el host inicie el juego...
            </p>
          </div>

          {/* Players count */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full">
              <span className="text-2xl font-bold">{game.players.length}</span>
              <span className="text-lg">jugador{game.players.length !== 1 ? 'es' : ''} conectado{game.players.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Players list */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">Jugadores en la sala:</h3>
            {game.players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{player.name}</p>
                </div>
                {player.id === currentPlayer?.id && (
                  <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-semibold">
                    Tú
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Loading animation */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Unirse a Sala
          </h1>
          <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-yellow-300 tracking-wider">
            {code}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleJoinGame} className="card-white p-6 sm:p-8 space-y-5 sm:space-y-6">
          <div>
            <label className="block text-base sm:text-lg font-bold mb-2 text-gray-900">
              Tu Nombre
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ingresa tu nombre"
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 sm:py-4 text-base sm:text-lg rounded-xl bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="btn-secondary flex-1 py-3 sm:py-4 text-base sm:text-lg"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 py-3 sm:py-4 text-base sm:text-lg">
              Unirse
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

