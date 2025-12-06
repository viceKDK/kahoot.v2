// ============================================================================
// SOCKET HOOK
// Custom hook para manejar conexión Socket.IO
// ============================================================================

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/shared/types';
import { useGameStore } from '@/store/gameStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Socket global por pestaña para no perder eventos al cambiar de página
let globalSocket: Socket | null = null;
let listenersRegistered = false;

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const {
    setGame,
    setCurrentPlayer,
    setPlayerState,
    setCurrentQuestion,
    setQuestionResults,
    setRanking,
    setGameStats,
    setFinalData,
    setIsConnected,
    setTransitionState,
    setAnswerFeedback,
    updateGameStatus,
    updatePlayers,
    currentPlayer,
  } = useGameStore();

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnection: true,
        reconnectionAttempts: 10,
      });
    }

    const socket = globalSocket;
    socketRef.current = socket;

    if (!listenersRegistered) {
      listenersRegistered = true;

      // Event: Conexión establecida
      socket.on('connect', () => {
        console.log('✓ Connected to server');
        setIsConnected(true);
      });

      // Event: Desconexión
      socket.on('disconnect', () => {
        console.log('✗ Disconnected from server');
        setIsConnected(false);
      });

      // Event: Juego creado (host)
      socket.on(SocketEvents.GAME_CREATED, (response) => {
        console.log('Game created:', response);
        setGame(response.game);

        // Crear un jugador virtual para el host (solo para referencia, no participa)
        const hostPlayer = {
          id: response.game.hostId,
          name: response.game.hostName,
          isHost: true,
        };
        setCurrentPlayer(hostPlayer as any);
      });

      // Event: Jugador se unió
      socket.on(SocketEvents.PLAYER_JOINED, (response) => {
        console.log('Joined game:', response);
        setGame(response.game);
        setCurrentPlayer(response.player); // ¡Crítico! Establecer el jugador actual
      });

      // Event: Juego actualizado (nuevo jugador se unió)
      socket.on(SocketEvents.GAME_UPDATED, (game) => {
        console.log('Game updated:', game);
        updatePlayers(game.players);
      });

      // Event: Juego iniciado
      socket.on(SocketEvents.GAME_STARTED, (game) => {
        console.log('Game started:', game);
        updateGameStatus(game.status);
      });

      // Event: Pregunta iniciada
      socket.on(SocketEvents.GAME_QUESTION_START, (payload) => {
        console.log('Question started:', payload);
        setCurrentQuestion(payload.question, payload.startTime);
        updateGameStatus('QUESTION' as any);
      });

      // Event: Pregunta terminada
      socket.on(SocketEvents.GAME_QUESTION_END, () => {
        console.log('Question ended');
        updateGameStatus('RESULTS' as any);
      });

      // Event: Mostrar resultados de pregunta
      socket.on(SocketEvents.GAME_SHOW_RESULTS, (payload) => {
        console.log('Show results:', payload);
        setQuestionResults(payload.questionResults);
      });

      // Event: Mostrar ranking
      socket.on(SocketEvents.GAME_SHOW_RANKING, (payload) => {
        console.log('Show ranking:', payload);
        setRanking(payload.ranking);
      });

      // Event: Actualización de estadísticas (para el host)
      socket.on(SocketEvents.GAME_STATS_UPDATE, (payload) => {
        console.log('Stats updated:', payload);
        setGameStats(payload);
      });

      // Event: Juego finalizado (LEGACY - mantener por compatibilidad)
      socket.on(SocketEvents.GAME_FINISHED, (payload) => {
        console.log('Game finished:', payload);
        setFinalData(payload);
        updateGameStatus('FINISHED' as any);
      });

      // ======================================================================
      // NUEVOS EVENTOS POR JUGADOR (UNICAST - ya filtrados por el servidor)
      // ======================================================================

      // Event: Pregunta individual iniciada
      socket.on(SocketEvents.PLAYER_QUESTION_START, (payload: any) => {
        console.log('Player question started:', payload);
        setPlayerState(payload.playerState);
        setCurrentQuestion(payload.question, payload.startTime);
        setTransitionState('idle');
        updateGameStatus('QUESTION' as any);
      });

      // Event: Feedback de respuesta (correcto/incorrecto)
      socket.on('player:answer_feedback', (payload: any) => {
        console.log('Answer feedback:', payload);
        setAnswerFeedback(payload);
        setTransitionState('showing_feedback');
      });

      // Event: Mostrar ranking actualizado
      socket.on('player:show_ranking', (payload: any) => {
        console.log('Show ranking:', payload);
        setRanking(payload.ranking, payload.currentPlayerRank);
        setTransitionState('showing_ranking');
      });

      // Event: Juego terminado individual
      socket.on(SocketEvents.PLAYER_GAME_FINISHED, (payload: any) => {
        console.log('Player game finished:', payload);
        setFinalData(payload);
        updateGameStatus('FINISHED' as any);
        setTransitionState('idle');
      });

      // Event: Error
      socket.on(SocketEvents.ERROR, (error) => {
        console.error('Socket error:', error);
        alert(error.message);
      });
    }

    // No desconectamos el socket en cleanup para que sobreviva al cambio de página
    return () => {
      // noop
    };
  }, [
    setGame,
    setCurrentPlayer,
    setPlayerState,
    setCurrentQuestion,
    setQuestionResults,
    setRanking,
    setGameStats,
    setFinalData,
    setIsConnected,
    setTransitionState,
    setAnswerFeedback,
    updateGameStatus,
    updatePlayers,
  ]);

  return socketRef.current;
};

