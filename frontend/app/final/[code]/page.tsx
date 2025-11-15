// ============================================================================
// FINAL PAGE
// Página final del juego - Podio, ranking completo e historial de preguntas
// ============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Podium from '@/components/Podium';
import RankingList from '@/components/RankingList';
import { motion } from 'framer-motion';

export default function FinalPage() {
  const router = useRouter();
  const { finalData, reset } = useGameStore();

  const [showHistory, setShowHistory] = useState(false);

  if (!finalData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-white text-xl">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  const handlePlayAgain = () => {
    reset();
    router.push('/');
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {!showHistory ? (
          <>
            {/* Podium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-6xl font-bold text-white text-center mb-4">
                🎉 ¡Juego Finalizado! 🎉
              </h1>
              <p className="text-2xl text-white/80 text-center mb-8">
                ¡Felicitaciones a los ganadores!
              </p>

              {finalData.podium.length > 0 && <Podium podium={finalData.podium} />}
            </motion.div>

            {/* Full Ranking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="mt-12"
            >
              <h2 className="text-4xl font-bold text-white text-center mb-6">
                Ranking Completo
              </h2>
              <RankingList ranking={finalData.finalRanking} showAccuracy />
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => setShowHistory(true)}
                className="btn-secondary px-8 py-4 text-xl"
              >
                📊 Ver Historial de Preguntas
              </button>
              <button
                onClick={handlePlayAgain}
                className="btn-primary px-8 py-4 text-xl"
              >
                🔄 Jugar de Nuevo
              </button>
            </motion.div>
          </>
        ) : (
          <>
            {/* Question History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={() => setShowHistory(false)}
                className="btn-secondary mb-8"
              >
                ← Volver al Podio
              </button>

              <h1 className="text-5xl font-bold text-white text-center mb-8">
                📊 Historial de Preguntas
              </h1>

              <div className="space-y-6">
                {finalData.questionHistory.map((item, index) => (
                  <motion.div
                    key={item.question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card-white p-6"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Pregunta {index + 1}: {item.question.text}
                    </h3>

                    <div className="space-y-3">
                      {item.question.options.map((option: any) => {
                        const votes = item.results?.optionVotes[option.id] || 0;
                        const totalVotes = item.results?.totalPlayers || 1;
                        const percentage = Math.round((votes / totalVotes) * 100);

                        return (
                          <div
                            key={option.id}
                            className={`
                              p-4 rounded-xl border-2
                              ${
                                option.isCorrect
                                  ? 'border-correct bg-correct/10'
                                  : 'border-gray-300'
                              }
                            `}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-gray-900">
                                {option.text}
                                {option.isCorrect && ' ✅'}
                              </span>
                              <span className="text-gray-600">
                                {votes} votos ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all ${
                                  option.isCorrect ? 'bg-correct' : 'bg-primary'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <button onClick={handlePlayAgain} className="btn-primary px-8 py-4 text-xl">
                  🔄 Jugar de Nuevo
                </button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
