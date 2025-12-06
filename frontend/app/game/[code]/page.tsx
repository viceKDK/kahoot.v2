// ============================================================================
// GAME PAGE
// Página principal del juego - Preguntas, Resultados, Rankings
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket, getCurrentSocket } from '@/hooks/useSocket';
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
  // Inicializa listeners de socket (no usamos el valor de retorno directamente)
  useSocket();
  const {
    game,
    currentPlayer,
    currentQuestion,
    questionStartTime,
    questionResults,
    ranking,
    currentPlayerRank,
    gameStats,
    finalData,
    hasAnswered,
    selectedOptionId,
    transitionState,
    answerFeedback,
    waitingForOthers,
    setHasAnswered,
    setSelectedOptionId,
    isConnected,
  } = useGameStore();

  const code = params.code as string;

  // Verificar si el usuario actual es el host
  const isHost = currentPlayer?.isHost === true;

  // Redirect si el juego terminó
  useEffect(() => {
    if (finalData) {
      router.push(`/final/${code}`);
    }
  }, [finalData, code, router]);

  const handleAnswerSelect = (optionId: string) => {
    const socket = getCurrentSocket();
    console.log('🎯 handleAnswerSelect called with optionId:', optionId);
    console.log('   socket:', socket ? 'Connected' : 'Not connected');
    console.log('   isConnected:', isConnected);
    console.log('   hasAnswered:', hasAnswered);
    console.log('   currentQuestion:', currentQuestion?.id);
    console.log('   currentPlayer:', currentPlayer?.id);

    if (!socket) {
      console.error('❌ No socket available');
      return;
    }
    if (!isConnected) {
      console.error('❌ Socket not connected');
      return;
    }
    if (hasAnswered) {
      console.error('❌ Already answered');
      return;
    }
    if (!currentQuestion) {
      console.error('❌ No current question');
      return;
    }
    if (!currentPlayer) {
      console.error('❌ No current player');
      return;
    }

    const timeElapsed = Date.now() - (questionStartTime || 0);
    console.log('⏱️ Time elapsed:', timeElapsed, 'ms');

    setSelectedOptionId(optionId);
    setHasAnswered(true);

    const payload = {
      gameId: code,
      playerId: currentPlayer.id,
      questionId: currentQuestion.id,
      optionId,
      timeElapsed,
    };

    console.log('📤 Emitting PLAYER_SUBMIT_ANSWER:', payload);
    socket.emit(SocketEvents.PLAYER_SUBMIT_ANSWER, payload);
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

  // Mostrar pantalla de espera mientras se espera a que todos respondan
  if (transitionState === 'waiting_others' && waitingForOthers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-white text-2xl mb-2">Esperando a que todos finalicen...</p>
          <p className="text-white/80 text-xl">
            {waitingForOthers.answeredCount}/{waitingForOthers.totalPlayers} jugadores han respondido
          </p>
        </div>
      </div>
    );
  }

  // Mostrar feedback de respuesta
  if (transitionState === 'showing_feedback' && answerFeedback) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`text-9xl mb-6 ${
              answerFeedback.isCorrect ? 'animate-bounce' : 'animate-pulse'
            }`}
          >
            {answerFeedback.isCorrect ? '✅' : '❌'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-6xl font-black mb-4 ${
              answerFeedback.isCorrect ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {answerFeedback.isCorrect ? '¡Correcto!' : 'Incorrecto'}
          </motion.h1>

          {answerFeedback.isCorrect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl px-12 py-6 shadow-2xl inline-block"
            >
              <p className="text-4xl font-black text-primary">
                +{answerFeedback.pointsEarned} puntos
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // Mostrar ranking
  if (transitionState === 'showing_ranking' && ranking) {
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
                playerStats={gameStats?.playerStats ?? []}
                currentQuestionNumber={gameStats?.currentQuestionIndex ?? 0}
                totalQuestions={gameStats?.totalQuestions ?? 0}
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
            {currentPlayerRank && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="inline-block bg-white/90 backdrop-blur-sm rounded-full px-8 py-3 shadow-xl mb-6"
              >
                <p className="text-2xl font-black text-primary">
                  Tu posición: #{currentPlayerRank}
                </p>
              </motion.div>
            )}
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

  // Mostrar resultados de la pregunta (LEGACY - puede removerse si no se usa)
  if (false && questionResults && currentQuestion) {
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
                playerStats={gameStats?.playerStats ?? []}
                currentQuestionNumber={gameStats?.currentQuestionIndex ?? 0}
                totalQuestions={gameStats?.totalQuestions ?? 0}
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
            {currentQuestion?.imageUrl && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
                className="flex justify-center mb-6"
              >
                <img
                  src={currentQuestion?.imageUrl ?? ''}
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
              {currentQuestion?.text ?? ''}
            </motion.h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
              {(currentQuestion?.options ?? []).map((option, index) => (
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
                      {(questionResults?.optionVotes?.[option.id] ?? 0)} votos
                    </span>
                    <span>
                      {Math.round(
                        ((questionResults?.optionVotes?.[option.id] ?? 0) /
                          Math.max(questionResults?.totalPlayers ?? 1, 1)) *
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
                          ((questionResults?.optionVotes?.[option.id] ?? 0) /
                            Math.max(questionResults?.totalPlayers ?? 1, 1)) *
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
                playerStats={gameStats?.playerStats ?? []}
                currentQuestionNumber={gameStats?.currentQuestionIndex ?? 0}
                totalQuestions={gameStats?.totalQuestions ?? 0}
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
      </>
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
