// ============================================================================
// HOME PAGE
// Página principal - Crear sala o unirse
// ============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function HomePage() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const { reset } = useGameStore();

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameCode.trim()) {
      router.push(`/join/${gameCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* Logo */}
        <div className="text-center">
          <motion.h1
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-7xl font-bold text-white text-shadow mb-4"
          >
            🎮 QuizArena
          </motion.h1>
          <p className="text-2xl text-white/80">
            Juega quizzes en tiempo real con tus amigos
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Crear Sala */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card-white p-8 space-y-4"
          >
            <div className="text-6xl text-center">🎯</div>
            <h2 className="text-2xl font-bold text-center">Crear Sala</h2>
            <p className="text-gray-600 text-center">
              Elige un quiz y comparte el código con tus amigos
            </p>
            <button
              onClick={() => {
                reset();
                router.push('/create');
              }}
              className="btn-primary w-full"
            >
              Crear Nueva Sala
            </button>
          </motion.div>

          {/* Unirse a Sala */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card-white p-8 space-y-4"
          >
            <div className="text-6xl text-center">🚀</div>
            <h2 className="text-2xl font-bold text-center">Unirse a Sala</h2>
            <form onSubmit={handleJoinGame} className="space-y-4">
              <input
                type="text"
                placeholder="Ingresa el código"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-900 text-center text-2xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="btn-primary w-full">
                Unirse
              </button>
            </form>
          </motion.div>
        </div>

        {/* Quiz Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Crear Quiz */}
          <div className="card p-6 space-y-3 text-center">
            <div className="text-4xl">📝</div>
            <h3 className="text-xl font-bold">Crear Quiz</h3>
            <button
              onClick={() => router.push('/quizzes/create')}
              className="btn-secondary w-full"
            >
              Nuevo Quiz
            </button>
          </div>

          {/* Mis Quizzes */}
          <div className="card p-6 space-y-3 text-center">
            <div className="text-4xl">📚</div>
            <h3 className="text-xl font-bold">Mis Quizzes</h3>
            <button
              onClick={() => router.push('/quizzes/my-quizzes')}
              className="btn-secondary w-full"
            >
              Ver Mis Quizzes
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/60 text-sm"
        >
          <p>Creado con ❤️ usando Next.js + Socket.IO</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

