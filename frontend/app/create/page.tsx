// ============================================================================
// CREATE GAME PAGE
// Página para crear una nueva sala (seleccionar quiz)
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { SocketEvents, Quiz } from '@/shared/types';
import { UserStorage } from '@/lib/userStorage';
import { motion } from 'framer-motion';

export default function CreateGamePage() {
  const router = useRouter();
  const socket = useSocket();
  const searchParams = useSearchParams();
  const { game, isConnected } = useGameStore();

  const [quizzes, setQuizzes] = useState<Omit<Quiz, 'questions'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [hostName, setHostName] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState('');

  // Fetch quizzes
  useEffect(() => {
    fetchQuizzes();

    // Pre-seleccionar quiz si viene de la URL
    const quizIdParam = searchParams.get('quizId');
    if (quizIdParam) {
      setSelectedQuizId(quizIdParam);
    }
  }, [searchParams]);

  // Redirect cuando se crea el juego
  useEffect(() => {
    if (game && game.code) {
      router.push(`/host/${game.code}`);
    }
  }, [game, router]);

  const fetchQuizzes = async () => {
    try {
      const userId = UserStorage.getUserId();

      // Fetch both public and user's quizzes
      const [publicResponse, userResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/quizzes/public`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/quizzes/creator/${userId}`)
      ]);

      const publicData = await publicResponse.json();
      const userData = await userResponse.json();

      const allQuizzes: Omit<Quiz, 'questions'>[] = [];

      // Agregar quizzes del usuario primero
      if (userData.success) {
        allQuizzes.push(...userData.data);
      }

      // Agregar quizzes públicos que no sean del usuario (evitar duplicados)
      if (publicData.success) {
        const userQuizIds = new Set(userData.data?.map((q: any) => q.id) || []);
        const publicQuizzes = publicData.data.filter((q: any) => !userQuizIds.has(q.id));
        allQuizzes.push(...publicQuizzes);
      }

      setQuizzes(allQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();

    if (!socket || !isConnected) {
      alert('No estás conectado al servidor');
      return;
    }

    if (!hostName.trim() || !selectedQuizId) {
      alert('Por favor completa todos los campos');
      return;
    }

    socket.emit(SocketEvents.HOST_CREATE_GAME, {
      quizId: selectedQuizId,
      hostName: hostName.trim(),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">Crear Nueva Sala</h1>
            <p className="text-xl text-white/80">
              Selecciona un quiz y ingresa tu nombre
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateGame} className="space-y-6">
            {/* Host Name */}
            <div className="card-white p-6">
              <label className="block text-lg font-bold mb-2 text-gray-900">
                Tu Nombre (Host)
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Ingresa tu nombre"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Quiz Selection */}
            <div className="card-white p-6">
              <label className="block text-lg font-bold mb-4 text-gray-900">
                Selecciona un Quiz
              </label>
              <div className="grid gap-4">
                {quizzes.map((quiz) => (
                  <motion.div
                    key={quiz.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedQuizId(quiz.id)}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${
                        selectedQuizId === quiz.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-300 hover:border-primary/50'
                      }
                    `}
                  >
                    <h3 className="text-xl font-bold text-gray-900">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-gray-600 mt-1">{quiz.description}</p>
                    )}
                  </motion.div>
                ))}

                {quizzes.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No hay quizzes disponibles
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1">
                Crear Sala
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
