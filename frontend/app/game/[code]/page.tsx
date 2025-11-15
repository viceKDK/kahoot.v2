// ============================================================================
// GAME PAGE
// Página principal del juego - Preguntas, Resultados, Rankings
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { SocketEvents, GameStatus } from '@/shared/types';
import Timer from '@/components/Timer';
import OptionButton from '@/components/OptionButton';
import RankingList from '@/components/RankingList';
import Podium from '@/components/Podium';
import { motion } from 'framer-motion';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const socket = useSocket();
  const {
    game,
    currentPlayer,
    currentQuestion,
    questionStartTime,
    questionResults,
    ranking,
    finalData,
    hasAnswered,
    selectedOptionId,
    setHasAnswered,
    setSelectedOptionId,
    isConnected,
  } = useGameStore();

  const code = params.code as string;
  const [showResults, setShowResults] = useState(false);
  const [showRanking, setShowRanking] = useState(false);

  // Redirect si el juego terminó
  useEffect(() => {
    if (finalData) {
      router.push(`/final/${code}`);
    }
  }, [finalData, code, router]);

  // Mostrar resultados cuando llegan
  useEffect(() => {
    if (questionResults) {
      setShowResults(true);
      setTimeout(() => {
        setShowResults(false);
      }, 5000);
    }
  }, [questionResults]);

  // Mostrar ranking cuando llega
  useEffect(() => {
    if (ranking) {
      setShowRanking(true);
      setTimeout(() => {
        setShowRanking(false);
      }, 5000);
    }
  }, [ranking]);

  const handleAnswerSelect = (optionId: string) => {
    if (!socket || !isConnected || hasAnswered || !currentQuestion || !currentPlayer) {
      return;
    }

    const timeElapsed = Date.now() - (questionStartTime || 0);

    setSelectedOptionId(optionId);
    setHasAnswered(true);

    socket.emit(SocketEvents.PLAYER_SUBMIT_ANSWER, {
      gameId: code,
      playerId: currentPlayer.id,
      questionId: currentQuestion.id,
      optionId,
      timeElapsed,
    });
  };

  // Waiting for game to start
  if (!game || game.status === GameStatus.LOBBY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-white text-xl">Esperando que el juego inicie...</p>
        </div>
      </div>
    );
  }

  // Mostrar ranking
  if (showRanking && ranking) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-bold text-white text-center mb-8">
              🏆 Ranking
            </h1>
            <RankingList ranking={ranking} showTop={5} showAccuracy />
          </motion.div>
        </div>
      </div>
    );
  }

  // Mostrar resultados de la pregunta
  if (showResults && questionResults && currentQuestion) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              {currentQuestion.text}
            </h1>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <OptionButton
                    option={option}
                    index={index}
                    onClick={() => {}}
                    isSelected={selectedOptionId === option.id}
                    isDisabled={true}
                    showCorrect={true}
                  />
                  {/* Stats */}
                  <div className="mt-2 px-4">
                    <div className="flex justify-between text-white/80 text-sm mb-1">
                      <span>
                        {questionResults.optionVotes[option.id] || 0} votos
                      </span>
                      <span>
                        {Math.round(
                          ((questionResults.optionVotes[option.id] || 0) /
                            questionResults.totalPlayers) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                      <div
                        className="bg-white h-3 rounded-full transition-all"
                        style={{
                          width: `${
                            ((questionResults.optionVotes[option.id] || 0) /
                              questionResults.totalPlayers) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Player result */}
            {currentPlayer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 card-white p-6 text-center"
              >
                <div className="text-6xl mb-4">
                  {questionResults.playerAnswers.find(
                    (a) => a.playerId === currentPlayer.id
                  )?.isCorrect
                    ? '✅'
                    : '❌'}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {questionResults.playerAnswers.find(
                    (a) => a.playerId === currentPlayer.id
                  )?.isCorrect
                    ? '¡Correcto!'
                    : 'Incorrecto'}
                </h2>
                <p className="text-3xl font-bold text-primary mt-2">
                  +
                  {questionResults.playerAnswers.find(
                    (a) => a.playerId === currentPlayer.id
                  )?.pointsEarned || 0}{' '}
                  puntos
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Mostrar pregunta activa
  if (game.status === GameStatus.QUESTION && currentQuestion && questionStartTime) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Timer */}
            <div className="flex justify-center mb-8">
              <Timer
                startTime={questionStartTime}
                duration={currentQuestion.timeLimit}
              />
            </div>

            {/* Question */}
            <h1 className="text-4xl font-bold text-white text-center mb-12">
              {currentQuestion.text}
            </h1>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentQuestion.options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <OptionButton
                    option={option}
                    index={index}
                    onClick={() => handleAnswerSelect(option.id)}
                    isSelected={selectedOptionId === option.id}
                    isDisabled={hasAnswered}
                  />
                </motion.div>
              ))}
            </div>

            {/* Answer status */}
            {hasAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-center"
              >
                <div className="card-white p-6 inline-block">
                  <p className="text-2xl font-bold text-primary">
                    ✅ Respuesta enviada
                  </p>
                  <p className="text-gray-600 mt-2">
                    Esperando a los demás jugadores...
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-white text-xl">Cargando...</p>
      </div>
    </div>
  );
}
