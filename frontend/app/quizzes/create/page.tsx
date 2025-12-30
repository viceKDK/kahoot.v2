// ============================================================================
// CREATE QUIZ PAGE
// Página para crear un nuevo quiz - Restaurada
// ============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Question } from '@/shared/types';
import { UserStorage } from '@/lib/userStorage';
import { useAuth } from '@/hooks/useAuth';
import QuestionEditor from '@/components/QuestionEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchBackend } from '@/lib/api';

export default function CreateQuizPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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
      const userId = user ? user.id : UserStorage.getUserId();

      const quizData = {
        title: title.trim(),
        description: description.trim(),
        createdBy: userId,
        isPublic,
        questions,
      };

      const response = await fetchBackend('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(quizData),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Quiz creado exitosamente!');
        router.push('/quizzes/my-quizzes');
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('❌ Error al crear el quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Volver al Inicio
          </button>
          <h1 className="text-5xl font-bold text-white mb-2 text-shadow">
            Crear Nuevo Quiz
          </h1>
          <p className="text-xl text-white/80">
            Diseña tu propio desafío para QuizArena
          </p>
        </div>

        {/* Warning if not logged in */}
        {!user && (
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 mb-6 text-white text-center">
            ⚠️ Estás en <strong>Modo Invitado</strong>. Para no perder tus quizzes, te recomendamos iniciar sesión.
          </div>
        )}

        {/* Quiz Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-white p-6 mb-6 space-y-4 shadow-2xl"
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
              placeholder="Un quiz divertido sobre..."
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
              Hacer público (otros podrán verlo)
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
            <h2 className="text-3xl font-bold text-white text-shadow">
              Preguntas ({questions.length})
            </h2>

            {questions.length === 0 ? (
              <div className="card-white p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600 text-lg">
                  Empieza agregando tu primera pregunta
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
                      className="card-white p-4 flex items-start gap-4 shadow-lg"
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
                                    ? 'bg-correct text-white font-semibold'
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
                          Borrar
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <button
              onClick={handleAddQuestion}
              className="w-full py-4 border-2 border-dashed border-white rounded-xl text-white hover:bg-white/10 transition-all font-bold"
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
              onClick={() => router.push('/')}
              className="flex-1 py-4 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveQuiz}
              disabled={saving || questions.length === 0}
              className="flex-1 py-4 btn-primary text-primary"
            >
              {saving ? 'Guardando...' : 'Guardar Quiz'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
