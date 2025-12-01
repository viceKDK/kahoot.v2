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
import AnswerPopup from '@/components/AnswerPopup';
import HostStatsTable from '@/components/HostStatsTable';
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
    gameStats,
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
  const [showAnswerPopup, setShowAnswerPopup] = useState(false);
  const [answerData, setAnswerData] = useState<{
    isCorrect: boolean;
    pointsEarned: number;
  } | null>(null);

  // Verificar si el usuario actual es el host
  const isHost = currentPlayer?.isHost === true;

  // Redirect si el juego terminó
  useEffect(() => {
    if (finalData) {
      router.push(`/final/${code}`);
    }
  }, [finalData, code, router]);

  // Mostrar pop-up de respuesta cuando llegan los resultados
  useEffect(() => {
    if (questionResults && currentPlayer) {
      const playerAnswer = questionResults.playerAnswers.find(
        (a) => a.playerId === currentPlayer.id
      );

      if (playerAnswer) {
        setAnswerData({
          isCorrect: playerAnswer.isCorrect,
          pointsEarned: playerAnswer.pointsEarned,
        });
        setShowAnswerPopup(true);
      }
    }
  }, [questionResults, currentPlayer]);

  // Mostrar resultados cuando llegan
  useEffect(() => {
    if (questionResults) {
      // Esperar a que el pop-up termine antes de mostrar resultados
      setTimeout(() => {
        setShowResults(true);
        setTimeout(() => {
          setShowResults(false);
        }, 5000);
      }, 2500);
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
    // Host siempre ve estadísticas
    if (isHost) {
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
              <p className="text-white/80 text-lg">{game?.quiz.title}</p>
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

    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-bold text-white text-center mb-8">
              🏆 Rankings en Vivo
            </h1>
            <RankingList
              ranking={ranking}
              showTop={5}
              showAccuracy
              currentPlayerId={currentPlayer?.id}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // Mostrar resultados de la pregunta
  if (showResults && questionResults && currentQuestion) {
    // Host siempre ve estadísticas
    if (isHost) {
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
              <p className="text-white/80 text-lg">{game?.quiz.title}</p>
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

    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Image (if exists) */}
            {currentQuestion.imageUrl && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
                className="flex justify-center mb-6"
              >
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question"
                  className="max-h-56 rounded-3xl shadow-2xl object-cover border-4 border-white/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </motion.div>
            )}

            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl md:text-4xl font-black text-white text-center mb-8 drop-shadow-lg"
            >
              {currentQuestion.text}
            </motion.h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
              {currentQuestion.options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, type: 'spring' }}
                  className="relative"
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
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    className="mt-3 px-4"
                  >
                    <div className="flex justify-between text-white font-bold text-base mb-2">
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
                    <div className="w-full bg-white/30 rounded-full h-4 overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            ((questionResults.optionVotes[option.id] || 0) /
                              questionResults.totalPlayers) *
                            100
                          }%`,
                        }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                        className="bg-white h-4 rounded-full shadow-lg"
                      />
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Mostrar pregunta activa
  if (game.status === GameStatus.QUESTION && currentQuestion && questionStartTime) {
    // Vista especial para el host: tabla de estadísticas
    if (isHost) {
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

    // Vista normal para jugadores
    return (
      <>
        <div className="min-h-screen p-4 md:p-8 flex flex-col">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
            {/* Timer */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="flex justify-center mb-6"
            >
              <Timer
                startTime={questionStartTime}
                duration={currentQuestion.timeLimit}
              />
            </motion.div>

            {/* Image (if exists) */}
            {currentQuestion.imageUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="flex justify-center mb-6"
              >
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question"
                  className="max-h-72 rounded-3xl shadow-2xl object-cover border-4 border-white/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </motion.div>
            )}

            {/* Question */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-black text-white text-center drop-shadow-lg leading-tight px-4">
                {currentQuestion.text}
              </h1>
            </motion.div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-1 content-start">
              {currentQuestion.options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.3 + index * 0.1,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  }}
                  whileHover={{ scale: hasAnswered ? 1 : 1.05 }}
                  whileTap={{ scale: hasAnswered ? 1 : 0.95 }}
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring' }}
                className="mt-6 text-center"
              >
                <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-sm px-8 py-4 rounded-full shadow-2xl">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-3xl"
                  >
                    ✅
                  </motion.div>
                  <div>
                    <p className="text-2xl font-black text-primary">
                      Respuesta enviada
                    </p>
                    <p className="text-gray-600 text-sm font-medium">
                      Esperando a los demás...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Answer Popup */}
        {answerData && (
          <AnswerPopup
            isCorrect={answerData.isCorrect}
            pointsEarned={answerData.pointsEarned}
            show={showAnswerPopup}
            onComplete={() => setShowAnswerPopup(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-white text-xl">Cargando...</p>
        </div>
      </div>

      {/* Answer Popup */}
      {answerData && (
        <AnswerPopup
          isCorrect={answerData.isCorrect}
          pointsEarned={answerData.pointsEarned}
          show={showAnswerPopup}
          onComplete={() => setShowAnswerPopup(false)}
        />
      )}
    </>
  );
}
