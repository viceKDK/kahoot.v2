// ============================================================================
// MY QUIZZES PAGE
// Página para gestionar mis quizzes (ver, editar, eliminar, duplicar)
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Quiz } from '@/shared/types';
import { UserStorage } from '@/lib/userStorage';
import { motion } from 'framer-motion';

export default function MyQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [showAll, setShowAll] = useState(false); // false = mis quizzes, true = todos los quizzes

  useEffect(() => {
    const name = UserStorage.getUserName();
    setUserName(name);
    fetchQuizzes();
  }, [showAll]); // Re-fetch cuando cambia showAll

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      let endpoint;
      if (showAll) {
        // Obtener TODOS los quizzes
        endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/quizzes`;
      } else {
        // Obtener solo mis quizzes
        const userId = UserStorage.getUserId();
        endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/quizzes/creator/${userId}`;
      }

      const response = await fetch(endpoint);
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
    if (!confirm('¿Estás seguro de eliminar este quiz? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/quizzes/${quizId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (result.success) {
        alert('✅ Quiz eliminado');
        fetchQuizzes();
      } else {
        alert('❌ Error al eliminar: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('❌ Error al eliminar el quiz');
    }
  };

  const handleDuplicate = async (quiz: Quiz) => {
    try {
      const userId = UserStorage.getUserId();

      // Fetch full quiz with questions
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/quizzes/${quiz.id}`
      );
      const result = await response.json();

      if (!result.success) {
        alert('❌ Error al cargar el quiz');
        return;
      }

      const fullQuiz = result.data;

      // Create duplicate
      const duplicateData = {
        title: `${fullQuiz.title} (Copia)`,
        description: fullQuiz.description,
        createdBy: userId,
        isPublic: false, // Las copias son privadas por defecto
        questions: fullQuiz.questions,
      };

      const createResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/quizzes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(duplicateData),
        }
      );

      const createResult = await createResponse.json();

      if (createResult.success) {
        alert('✅ Quiz duplicado exitosamente!');
        fetchQuizzes();
      } else {
        alert('❌ Error al duplicar: ' + createResult.error);
      }
    } catch (error) {
      console.error('Error duplicating quiz:', error);
      alert('❌ Error al duplicar el quiz');
    }
  };

  const handleEdit = (quizId: string) => {
    router.push(`/quizzes/edit/${quizId}`);
  };

  const handleCreateGame = (quizId: string) => {
    // Guardar quizId seleccionado y redirigir a create con el quiz pre-seleccionado
    router.push(`/create?quizId=${quizId}`);
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white mb-4"
          >
            ← Volver al Inicio
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">
                {showAll ? 'Todos los Quizzes' : 'Mis Quizzes'}
              </h1>
              <p className="text-xl text-white/80">
                {showAll
                  ? 'Explora y gestiona todos los quizzes disponibles'
                  : 'Gestiona tus quizzes creados'}
              </p>
            </div>
            <button
              onClick={() => setShowAll(!showAll)}
              className="btn-primary px-6 py-3 whitespace-nowrap"
            >
              {showAll ? '👤 Ver Mis Quizzes' : '🌍 Ver Todos'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push('/quizzes/create')}
            className="btn-primary px-6 py-3"
          >
            + Crear Nuevo Quiz
          </button>
        </motion.div>

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-white p-12 text-center"
          >
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {showAll
                ? 'No hay quizzes disponibles'
                : 'No tienes quizzes todavía'}
            </h2>
            <p className="text-gray-600 mb-6">
              {showAll
                ? 'Sé el primero en crear un quiz'
                : 'Crea tu primer quiz para comenzar'}
            </p>
            <button
              onClick={() => router.push('/quizzes/create')}
              className="btn-primary"
            >
              {showAll ? 'Crear Nuevo Quiz' : 'Crear Mi Primer Quiz'}
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-white p-6 space-y-4"
              >
                {/* Header */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="text-gray-600 mt-1">{quiz.description}</p>
                  )}
                </div>

                {/* Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                    {(quiz as any).questions?.length || 0} preguntas
                  </span>
                  {quiz.isPublic && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                      Público
                    </span>
                  )}
                  {!quiz.isPublic && (
                    <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-semibold">
                      Privado
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleCreateGame(quiz.id)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
                  >
                    🎮 Jugar
                  </button>
                  <button
                    onClick={() => handleEdit(quiz.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDuplicate(quiz)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
                  >
                    📋 Duplicar
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
