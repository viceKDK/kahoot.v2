// ============================================================================
// EDIT QUIZ PAGE
// Página para editar un quiz existente
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Question, Quiz } from '@/shared/types';
import { UserStorage } from '@/lib/userStorage';
import QuestionEditor from '@/components/QuestionEditor';
import { motion, AnimatePresence } from 'framer-motion';

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [originalCreatedBy, setOriginalCreatedBy] = useState<string>(''); // Guardar creador original

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/quizzes/${quizId}`
      );
      const result = await response.json();

      if (result.success) {
        const quiz: Quiz = result.data;

        // TEMPORAL: Permitir editar cualquier quiz hasta implementar sistema de cuentas
        // const userId = UserStorage.getUserId();
        // if (quiz.createdBy !== userId) {
        //   alert('No tienes permiso para editar este quiz');
        //   router.push('/quizzes/my-quizzes');
        //   return;
        // }

        // Guardar el creador original para mantenerlo al actualizar
        setOriginalCreatedBy(quiz.createdBy);

        setTitle(quiz.title);
        setDescription(quiz.description || '');
        setIsPublic(quiz.isPublic);
        setQuestions(quiz.questions);
      } else {
        alert('❌ Error: Quiz no encontrado');
        router.push('/quizzes/my-quizzes');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      alert('❌ Error al cargar el quiz');
      router.push('/quizzes/my-quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingIndex(questions.length);
  };

  const handleSaveQuestion = (question: Omit<Question, 'id'>) => {
    if (editingIndex !== null) {
      const newQuestions = [...questions];
      if (editingIndex < questions.length) {
        newQuestions[editingIndex] = question;
      } else {
        newQuestions.push(question);
      }
      setQuestions(newQuestions);
      setEditingIndex(null);
    }
  };

  const handleEditQuestion = (index: number) => {
    setEditingIndex(index);
  };

  const handleDeleteQuestion = (index: number) => {
    if (confirm('¿Eliminar esta pregunta?')) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      alert('Por favor ingresa un título para el quiz');
      return;
    }

    if (questions.length === 0) {
      alert('Debes agregar al menos una pregunta');
      return;
    }

    try {
      setSaving(true);

      // Primero eliminar el quiz anterior
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      // Crear uno nuevo con los mismos datos actualizados
      // MANTENER el creador original, no cambiar al usuario actual
      const quizData = {
        title: title.trim(),
        description: description.trim(),
        createdBy: originalCreatedBy, // Mantener creador original
        isPublic,
        questions,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Quiz actualizado exitosamente!');
        router.push('/quizzes/my-quizzes');
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('❌ Error al actualizar el quiz');
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/quizzes/my-quizzes')}
            className="text-white/80 hover:text-white mb-4"
          >
            ← Volver a Mis Quizzes
          </button>
          <h1 className="text-5xl font-bold text-white mb-2">
            Editar Quiz
          </h1>
          <p className="text-xl text-white/80">
            Modifica tu quiz existente
          </p>
        </div>

        {/* Quiz Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-white p-6 mb-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-900">
              Título del Quiz *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz de Cultura General"
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-900">
              Descripción (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Un quiz divertido sobre cultura general..."
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="isPublic" className="text-gray-900 font-medium">
              Hacer público (otros usuarios podrán usar este quiz)
            </label>
          </div>
        </motion.div>

        {/* Questions List */}
        {editingIndex === null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 mb-6"
          >
            <h2 className="text-3xl font-bold text-white">
              Preguntas ({questions.length})
            </h2>

            {questions.length === 0 ? (
              <div className="card-white p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600 text-lg">
                  No has agregado preguntas todavía
                </p>
                <p className="text-gray-500 mt-2">
                  Haz clic en "Agregar Pregunta" para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {questions.map((question, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="card-white p-4 flex items-start gap-4"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {index + 1}. {question.text}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`
                                text-sm px-3 py-2 rounded-lg
                                ${
                                  option.isCorrect
                                    ? 'bg-correct/20 text-correct font-semibold'
                                    : 'bg-gray-100 text-gray-700'
                                }
                              `}
                            >
                              {option.isCorrect && '✓ '}
                              {option.text}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditQuestion(index)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(index)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Add Question Button */}
            <button
              onClick={handleAddQuestion}
              className="w-full py-4 border-2 border-dashed border-white/50 rounded-xl text-white hover:border-white hover:bg-white/10 transition-all"
            >
              + Agregar Pregunta
            </button>
          </motion.div>
        )}

        {/* Question Editor */}
        {editingIndex !== null && (
          <QuestionEditor
            question={editingIndex < questions.length ? questions[editingIndex] : undefined}
            onSave={handleSaveQuestion}
            onCancel={handleCancelEdit}
            questionNumber={editingIndex + 1}
          />
        )}

        {/* Actions */}
        {editingIndex === null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4"
          >
            <button
              onClick={() => router.push('/quizzes/my-quizzes')}
              className="flex-1 py-4 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveQuiz}
              disabled={saving || questions.length === 0}
              className="flex-1 py-4 bg-white text-primary font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
