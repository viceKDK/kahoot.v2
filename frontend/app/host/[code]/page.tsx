// ============================================================================
// HOST LOBBY PAGE
// Página del host - Muestra QR, código y jugadores conectados
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { SocketEvents, GameStatus } from '@/shared/types';
import PlayerCard from '@/components/PlayerCard';
import HostStatsTable from '@/components/HostStatsTable';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

export default function HostLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const socket = useSocket();
  const { game, currentPlayer, gameStats, isConnected } = useGameStore();

  const code = params.code as string;
  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${code}`
      : '';

  const handleStartGame = () => {
    if (!socket || !isConnected || !currentPlayer) {
      alert('No estás conectado');
      return;
    }

    if (!game || game.players.length < 1) {
      alert('Necesitas al menos 1 jugador para iniciar');
      return;
    }

    socket.emit(SocketEvents.HOST_START_GAME, {
      code,
      hostId: currentPlayer.id,
    });
  };

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-white">Cargando sala...</p>
        </div>
      </div>
    );
  }

  // Si el juego está activo, mostrar estadísticas
  if (game.status === GameStatus.PLAYING || game.status === GameStatus.FINISHED) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              Vista del Host - Panel de Control
            </h1>
            <p className="text-white/80 text-lg">{game.quiz.title}</p>
            <p className="text-white/60 text-sm mt-2">Código: {code}</p>
          </motion.div>

          {gameStats ? (
            <HostStatsTable
              playerStats={gameStats.playerStats}
              currentQuestionNumber={gameStats.currentQuestionIndex}
              totalQuestions={gameStats.totalQuestions}
            />
          ) : (
            <div className="card-white p-8 text-center">
              <div className="spinner mx-auto mb-4" />
              <p className="text-gray-600">Cargando estadísticas...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lobby (antes de iniciar)
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white mb-4"
          >
            ← Volver al Inicio
          </button>
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-2">Sala Creada</h1>
            <p className="text-2xl text-white/80">{game.quiz.title}</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: QR and Code */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Code */}
            <div className="card-white p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Código de Sala
              </h2>
              <div className="text-6xl font-bold text-primary tracking-wider mb-4">
                {code}
              </div>
              <p className="text-gray-600">
                Comparte este código para que se unan
              </p>
            </div>

            {/* QR Code */}
            <div className="card-white p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Escanea el QR
              </h2>
              <div className="flex justify-center mb-4">
                <QRCodeSVG value={joinUrl} size={200} />
              </div>
              <p className="text-sm text-gray-600 break-all">{joinUrl}</p>
            </div>
          </motion.div>

          {/* Right: Players */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Players Count */}
            <div className="card-white p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Jugadores Conectados
              </h2>
              <div className="text-5xl font-bold text-primary mt-2">
                {game.players.length}
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {game.players.map((player, index) => (
                <PlayerCard key={player.id} player={player} index={index} />
              ))}
            </div>

            {/* Start Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartGame}
              className="btn-primary w-full text-xl py-4"
            >
              🚀 Iniciar Juego
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
