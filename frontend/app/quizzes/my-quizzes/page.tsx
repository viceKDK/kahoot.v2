// ============================================================================
// MY QUIZZES PAGE
// Página para gestionar mis quizzes - Restaurada
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Quiz } from '@/shared/types';
import { UserStorage } from '@/lib/userStorage';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchBackend } from '@/lib/api';

export default function MyQuizzesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, [showAll, user]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      let endpoint;
      if (showAll) {
        endpoint = '/api/quizzes';
      } else {
        const userId = user ? user.id : UserStorage.getUserId();
        endpoint = `/api/quizzes/creator/${userId}`;
      }

      const response = await fetchBackend(endpoint);
      const result = await response.json();

      if (result.success) {
        setQuizzes(result.data);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('¿Estás seguro de eliminar este quiz?')) return;

    try {
      const response = await fetchBackend(`/api/quizzes/${quizId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) fetchQuizzes();
      else alert('❌ Error: ' + result.error);
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  const handleDuplicate = async (quiz: Quiz) => {
    try {
      const userId = user ? user.id : UserStorage.getUserId();
      const response = await fetchBackend(`/api/quizzes/${quiz.id}`);
      const result = await response.json();
      if (!result.success) return;

      const fullQuiz = result.data;
      const duplicateData = {
        title: `${fullQuiz.title} (Copia)`,
        description: fullQuiz.description,
        createdBy: userId,
        isPublic: false,
        questions: fullQuiz.questions,
      };

      const createResponse = await fetchBackend('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(duplicateData),
      });

      if ((await createResponse.json()).success) {
        alert('✅ Duplicado!');
        fetchQuizzes();
      }
    } catch (error) {
      console.error('Error duplicating quiz:', error);
    }
  };

  const handleEdit = (quizId: string) => router.push(`/quizzes/edit/${quizId}`);
  const handleCreateGame = (quizId: string) => router.push(`/create?quizId=${quizId}`);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white mb-4"
          >
            ← Volver al Inicio
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2 text-shadow">
                {showAll ? 'Quizzes Públicos' : 'Mis Quizzes'}
              </h1>
              <p className="text-xl text-white/80">
                {showAll ? 'Explora la comunidad' : 'Tus creaciones'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="btn-secondary"
              >
                {showAll ? '👤 Mis Quizzes' : '🌍 Ver Todos'}
              </button>
              <button
                onClick={() => router.push('/quizzes/create')}
                className="btn-primary"
              >
                + Crear Nuevo
              </button>
            </div>
          </div>
        </div>

        {/* Quizzes Grid */}
        {quizzes.length === 0 ? (
          <div className="card-white p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay nada por aquí</h2>
            <button onClick={() => router.push('/quizzes/create')} className="btn-primary mt-4 bg-primary text-white">
              Crear Primer Quiz
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card-white p-6 flex flex-col shadow-xl"
                >
                  <div className="flex-1 mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{quiz.description}</p>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button onClick={() => handleCreateGame(quiz.id)} className="flex-1 bg-primary text-white py-2 rounded-xl font-bold">🎮 Jugar</button>
                    <button onClick={() => handleEdit(quiz.id)} className="bg-blue-500 text-white p-2 rounded-xl">✏️</button>
                    <button onClick={() => handleDelete(quiz.id)} className="bg-red-500 text-white p-2 rounded-xl">🗑️</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
