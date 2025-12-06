// ============================================================================
// GAME SOCKET HANDLER
// GRASP: Controller - Maneja eventos de Socket.IO
// SOLID: Single Responsibility - Solo gestiona comunicación WebSocket
// ============================================================================

import { Server, Socket } from 'socket.io';
import {
  SocketEvents,
  CreateGamePayload,
  JoinGamePayload,
  SubmitAnswerPayload,
  CreateGameResponse,
  JoinGameResponse,
  ErrorPayload,
  GameMode,
} from '../../../shared/types';
import GameService from '../services/GameService';

export class GameSocketHandler {
  private io: Server;
  // private questionTimeouts: Map<string, NodeJS.Timeout> = new Map(); // LEGACY - no usado
  private playerSockets: Map<string, string> = new Map(); // playerId -> socketId

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Configura todos los event handlers
   */
  setupHandlers(socket: Socket): void {
    // Host crea un juego
    socket.on(SocketEvents.HOST_CREATE_GAME, async (payload: CreateGamePayload) => {
      try {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const { game, qrCode, joinUrl } = await GameService.createGame(
          payload.quizId,
          payload.hostName,
          baseUrl,
          payload.mode ?? GameMode.FAST
        );

        // El host se une a la room del juego
        socket.join(game.code);

        const response: CreateGameResponse = { game, qrCode, joinUrl };
        socket.emit(SocketEvents.GAME_CREATED, response);

        console.log(`Game created: ${game.code} by ${payload.hostName}`);
      } catch (error: any) {
        const errorPayload: ErrorPayload = {
          message: error.message || 'Failed to create game',
        };
        socket.emit(SocketEvents.ERROR, errorPayload);
        console.error('Error creating game:', error);
      }
    });

    // Jugador se une a un juego
    socket.on(SocketEvents.PLAYER_JOIN_GAME, (payload: JoinGamePayload) => {
      try {
        const { game, player } = GameService.joinGame(payload.code, payload.playerName);

        // El jugador se une a la room del juego
        socket.join(game.code);

        // Registrar mapeo socket-player
        this.playerSockets.set(player.id, socket.id);

        const response: JoinGameResponse = { game, player };
        socket.emit(SocketEvents.PLAYER_JOINED, response);

        // Notificar a todos los clientes que el juego se actualizó
        this.io.emit(SocketEvents.GAME_UPDATED, game);

        console.log(`Player ${player.name} joined game ${game.code} (socketId: ${socket.id})`);
      } catch (error: any) {
        const errorPayload: ErrorPayload = {
          message: error.message || 'Failed to join game',
        };
        socket.emit(SocketEvents.ERROR, errorPayload);
        console.error('Error joining game:', error);
      }
    });

    // Host inicia el juego
    socket.on(
      SocketEvents.HOST_START_GAME,
      async (payload: { code: string; hostId: string }) => {
        try {
          const game = await GameService.startGame(payload.code, payload.hostId);

          // Validar que el quiz tenga preguntas antes de iniciar
          if (!game.quiz.questions || game.quiz.questions.length === 0) {
            const errorPayload: ErrorPayload = {
              message:
                'El quiz seleccionado no tiene preguntas. Edita el quiz y añade al menos una pregunta antes de iniciar el juego.',
            };
            socket.emit(SocketEvents.ERROR, errorPayload);
            console.error('Cannot start game without questions', game.code);
            return;
          }

          // Notificar a todos que el juego inició
          this.io.to(game.code).emit(SocketEvents.GAME_STARTED, game);

          // Iniciar la primera pregunta para cada jugador (individualmente) después de 2 segundos
          setTimeout(() => {
            this.startQuestionsForAllPlayers(game.code);
          }, 2000);

          console.log(`Game ${game.code} started`);
        } catch (error: any) {
          const errorPayload: ErrorPayload = {
            message: error.message || 'Failed to start game',
          };
          socket.emit(SocketEvents.ERROR, errorPayload);
          console.error('Error starting game:', error);
        }
      }
    );

    // Jugador envía respuesta (NUEVA LÓGICA CON ESTADO POR JUGADOR)
    socket.on(SocketEvents.PLAYER_SUBMIT_ANSWER, (payload: SubmitAnswerPayload) => {
      try {
        console.log(`📥 Answer received from player ${payload.playerId} in game ${payload.gameId}`);

        const game = GameService.getGame(payload.gameId);
        if (!game) {
          throw new Error('Game not found');
        }

        console.log(`🎮 Game mode: ${game.mode}`);

        // Usar nuevo método que actualiza estado individual
        const { answer, playerState } = GameService.submitPlayerAnswer(
          payload.gameId,
          payload.playerId,
          payload.optionId,
          payload.timeElapsed
        );

        console.log(`💾 Answer saved: ${answer.isCorrect ? 'CORRECT' : 'INCORRECT'} (+${answer.pointsEarned} pts)`);

        // Confirmar al jugador que su respuesta fue recibida
        socket.emit('answer:submitted', { answer });

        // Enviar estadísticas actualizadas al host
        this.sendStatsToHost(payload.gameId);

        // Lógica según el modo
        if (game.mode === GameMode.FAST) {
          console.log(`⚡ FAST MODE: Handling individual advance for player ${payload.playerId}`);
          // MODO RÁPIDO: el jugador avanza inmediatamente a la siguiente pregunta
          this.handleFastModeAdvance(payload.gameId, payload.playerId);
        } else if (game.mode === GameMode.WAIT_ALL) {
          console.log(`⏳ WAIT_ALL MODE: Checking if all players answered question ${playerState.currentQuestionIndex}`);
          // MODO ESPERAR: verificar si todos los jugadores en esta pregunta han respondido
          this.handleWaitAllModeAdvance(payload.gameId, playerState.currentQuestionIndex);
        }

        console.log(
          `✅ Answer submitted by player ${payload.playerId} in game ${payload.gameId} (Mode: ${game.mode})`
        );
      } catch (error: any) {
        const errorPayload: ErrorPayload = {
          message: error.message || 'Failed to submit answer',
        };
        socket.emit(SocketEvents.ERROR, errorPayload);
        console.error('❌ Error submitting answer:', error);
      }
    });

    // Host pasa a la siguiente pregunta (LEGACY - en el nuevo sistema cada jugador avanza automáticamente)
    socket.on(SocketEvents.HOST_NEXT_QUESTION, (payload: { code: string }) => {
      try {
        const hasMore = GameService.moveToNextQuestion(payload.code);

        if (!hasMore) {
          this.finishGame(payload.code);
        }
        // En el nuevo sistema, no necesitamos llamar startQuestion manualmente
        // Los jugadores avanzan automáticamente en handleFastModeAdvance o handleWaitAllModeAdvance
      } catch (error: any) {
        const errorPayload: ErrorPayload = {
          message: error.message || 'Failed to move to next question',
        };
        socket.emit(SocketEvents.ERROR, errorPayload);
        console.error('Error moving to next question:', error);
      }
    });

    // Host termina el juego manualmente
    socket.on(SocketEvents.HOST_END_GAME, (payload: { code: string }) => {
      try {
        this.finishGame(payload.code);
      } catch (error: any) {
        const errorPayload: ErrorPayload = {
          message: error.message || 'Failed to end game',
        };
        socket.emit(SocketEvents.ERROR, errorPayload);
        console.error('Error ending game:', error);
      }
    });

    // Jugador se desconecta
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // Buscar y eliminar jugador del mapeo
      for (const [playerId, socketId] of this.playerSockets.entries()) {
        if (socketId === socket.id) {
          this.playerSockets.delete(playerId);
          console.log(`Player ${playerId} disconnected`);

          // TODO: Opcional - remover jugador del juego activo
          // GameService.removePlayer(code, playerId);
          break;
        }
      }
    });
  }

  /**
   * Envía un evento a un jugador específico (unicast)
   * @param playerId - ID del jugador
   * @param event - Nombre del evento
   * @param payload - Datos del evento
   */
  private emitToPlayer(playerId: string, event: string, payload: any): void {
    const socketId = this.playerSockets.get(playerId);
    if (socketId) {
      console.log(`📤 Emitting "${event}" to player ${playerId} (socket: ${socketId})`);
      this.io.to(socketId).emit(event, payload);
    } else {
      console.warn(`⚠️ Cannot emit "${event}" to player ${playerId}: socket not found`);
      console.warn(`   Available sockets:`, Array.from(this.playerSockets.keys()));
    }
  }

  /**
   * Inicia preguntas para todos los jugadores (al iniciar el juego)
   * @param code - Código del juego
   */
  private startQuestionsForAllPlayers(code: string): void {
    try {
      const game = GameService.getGame(code);
      if (!game) {
        console.error('Game not found:', code);
        return;
      }

      // Iniciar primera pregunta para cada jugador
      game.players.forEach((player) => {
        this.startQuestionForPlayer(code, player.id);
      });

      // Enviar estadísticas iniciales al host
      this.sendStatsToHost(code);

      console.log(`Questions started for all players in game ${code}`);
    } catch (error) {
      console.error('Error starting questions for all players:', error);
    }
  }

  /**
   * Inicia una pregunta para un jugador específico
   * @param code - Código del juego
   * @param playerId - ID del jugador
   */
  private startQuestionForPlayer(code: string, playerId: string): void {
    try {
      const game = GameService.getGame(code);
      if (!game) {
        console.error('Game not found:', code);
        return;
      }

      // Iniciar pregunta para este jugador
      const playerState = GameService.startPlayerQuestion(code, playerId);
      const currentQuestion = game.quiz.questions[playerState.currentQuestionIndex];

      if (!currentQuestion) {
        console.error(
          'No current question found for player',
          playerId,
          'index',
          playerState.currentQuestionIndex
        );
        return;
      }

      const player = game.players.find((p) => p.id === playerId);
      if (!player) {
        console.error('Player not found:', playerId);
        return;
      }

      // Enviar evento UNICAST solo a este jugador específico
      this.emitToPlayer(playerId, SocketEvents.PLAYER_QUESTION_START, {
        question: currentQuestion,
        questionNumber: playerState.currentQuestionIndex + 1,
        totalQuestions: game.quiz.questions.length,
        startTime: playerState.questionStartTime!,
        playerState,
      });

      console.log(
        `Question ${playerState.currentQuestionIndex + 1} started for player ${playerId} in game ${code}`
      );
    } catch (error) {
      console.error('Error starting question for player:', error);
    }
  }

  // LEGACY methods removed - el nuevo sistema usa handleFastModeAdvance y handleWaitAllModeAdvance
  // que manejan las transiciones individualmente por jugador

  /**
   * Maneja el avance en modo RÁPIDO (individual)
   * @param code - Código del juego
   * @param playerId - ID del jugador que respondió
   */
  private handleFastModeAdvance(code: string, playerId: string): void {
    try {
      console.log(`🚀 handleFastModeAdvance for player ${playerId} in game ${code}`);

      const game = GameService.getGame(code);
      if (!game) {
        console.error('Game not found:', code);
        return;
      }

      const playerState = GameService.getPlayerState(code, playerId);
      if (!playerState) {
        console.error('Player state not found:', playerId);
        return;
      }

      const currentQuestion = game.quiz.questions[playerState.currentQuestionIndex];
      if (!currentQuestion) {
        console.error('Current question not found for index:', playerState.currentQuestionIndex);
        return;
      }

      const lastAnswer = playerState.answers[playerState.answers.length - 1];
      if (!lastAnswer) {
        console.error('No answer found for player:', playerId);
        return;
      }

      console.log(`✅ Sending feedback to player ${playerId}: ${lastAnswer.isCorrect ? 'CORRECT' : 'INCORRECT'} (+${lastAnswer.pointsEarned} pts)`);

      // 1. Enviar feedback inmediato de la respuesta
      this.emitToPlayer(playerId, 'player:answer_feedback', {
        isCorrect: lastAnswer.isCorrect,
        pointsEarned: lastAnswer.pointsEarned,
        correctOptionId: currentQuestion.options.find((o) => o.isCorrect)?.id,
        selectedOptionId: lastAnswer.optionId,
      });

      // 2. Después de 2 segundos, mostrar ranking actualizado
      setTimeout(() => {
        console.log(`📊 Sending ranking to player ${playerId}`);
        const { ranking } = GameService.getRanking(code);
        const playerRank = ranking.find((e) => e.player.id === playerId);

        this.emitToPlayer(playerId, 'player:show_ranking', {
          ranking,
          currentPlayerRank: playerRank?.rank || 0,
          topPlayers: ranking.slice(0, 5),
        });

        // 3. Después de 3 segundos, avanzar a la siguiente pregunta
        setTimeout(() => {
          console.log(`⏭️ Advancing player ${playerId} to next question`);
          const hasMore = GameService.advancePlayerToNextQuestion(code, playerId);

          if (hasMore) {
            console.log(`✅ Player ${playerId} has more questions, starting next one`);
            // Iniciar siguiente pregunta para este jugador
            this.startQuestionForPlayer(code, playerId);
          } else {
            console.log(`🏁 Player ${playerId} finished all questions`);
            // Jugador terminó su juego, mostrar pantalla final individual
            this.showPlayerFinalScreen(code, playerId);

            // Verificar si todos terminaron para finalizar el juego global
            if (GameService.haveAllPlayersFinished(code)) {
              this.finishGame(code);
            }
          }
        }, 3000); // Ranking por 3 segundos
      }, 2000); // Feedback por 2 segundos
    } catch (error) {
      console.error('Error handling fast mode advance:', error);
    }
  }

  /**
   * Maneja el avance en modo ESPERAR (colectivo por pregunta)
   * @param code - Código del juego
   * @param questionIndex - Índice de la pregunta
   */
  private handleWaitAllModeAdvance(code: string, questionIndex: number): void {
    try {
      const game = GameService.getGame(code);
      if (!game) return;

      // Obtener todos los jugadores en esta pregunta
      const playersInThisQuestion = game.players.filter((player) => {
        const state = game.playerStates[player.id];
        return state && state.currentQuestionIndex === questionIndex;
      });

      // Verificar si todos los jugadores en esta pregunta han respondido
      const allAnswered = playersInThisQuestion.every((player) => {
        const state = game.playerStates[player.id];
        return state && state.hasAnsweredCurrent;
      });

      if (!allAnswered) {
        // Aún hay jugadores sin responder, no hacer nada
        return;
      }

      const currentQuestion = game.quiz.questions[questionIndex];
      if (!currentQuestion) return;

      // Todos respondieron, avanzar a todos juntos
      // 1. Enviar feedback individual a cada jugador
      playersInThisQuestion.forEach((player) => {
        const playerState = game.playerStates[player.id];
        if (!playerState) return;

        const lastAnswer = playerState.answers[playerState.answers.length - 1];

        this.emitToPlayer(player.id, 'player:answer_feedback', {
          isCorrect: lastAnswer.isCorrect,
          pointsEarned: lastAnswer.pointsEarned,
          correctOptionId: currentQuestion.options.find((o) => o.isCorrect)?.id,
          selectedOptionId: lastAnswer.optionId,
        });
      });

      // 2. Después de 2 segundos, mostrar ranking a todos
      setTimeout(() => {
        const { ranking } = GameService.getRanking(code);

        playersInThisQuestion.forEach((player) => {
          const playerRank = ranking.find((e) => e.player.id === player.id);

          this.emitToPlayer(player.id, 'player:show_ranking', {
            ranking,
            currentPlayerRank: playerRank?.rank || 0,
            topPlayers: ranking.slice(0, 5),
          });
        });

        // 3. Después de 3 segundos, avanzar a todos a la siguiente pregunta
        setTimeout(() => {
          playersInThisQuestion.forEach((player) => {
            const hasMore = GameService.advancePlayerToNextQuestion(code, player.id);

            if (hasMore) {
              // Iniciar siguiente pregunta
              this.startQuestionForPlayer(code, player.id);
            } else {
              // Jugador terminó
              this.showPlayerFinalScreen(code, player.id);
            }
          });

          // Verificar si todos terminaron
          if (GameService.haveAllPlayersFinished(code)) {
            this.finishGame(code);
          }
        }, 3000); // Ranking por 3 segundos
      }, 2000); // Feedback por 2 segundos
    } catch (error) {
      console.error('Error handling wait-all mode advance:', error);
    }
  }

  /**
   * Muestra la pantalla final a un jugador individual
   * @param code - Código del juego
   * @param playerId - ID del jugador
   */
  private showPlayerFinalScreen(code: string, playerId: string): void {
    try {
      const game = GameService.getGame(code);
      if (!game) return;

      const { ranking } = GameService.getRanking(code);
      const playerRankEntry = ranking.find((entry) => entry.player.id === playerId);
      const player = game.players.find((p) => p.id === playerId);

      if (!playerRankEntry || !player) return;

      // Emitir evento UNICAST solo a este jugador
      this.emitToPlayer(playerId, SocketEvents.PLAYER_GAME_FINISHED, {
        finalRanking: ranking,
        playerRank: playerRankEntry.rank,
        playerScore: player.score,
        podium: ranking.slice(0, 3),
        questionHistory: game.quiz.questions.map((question, index) => ({
          question,
          results: game.results[index],
        })),
      });

      console.log(`Player ${playerId} finished game ${code}`);
    } catch (error) {
      console.error('Error showing player final screen:', error);
    }
  }

  /**
   * Envía estadísticas en tiempo real al host
   * @param code - Código del juego
   */
  private sendStatsToHost(code: string): void {
    try {
      const stats = GameService.getGameStats(code);
      if (stats) {
        this.io.to(code).emit(SocketEvents.GAME_STATS_UPDATE, stats);
      }
    } catch (error) {
      console.error('Error sending stats to host:', error);
    }
  }

  /**
   * Finaliza el juego
   * @param code - Código del juego
   */
  private async finishGame(code: string): Promise<void> {
    try {
      const { finalRanking, podium, questionHistory } =
        await GameService.finishGame(code);

      this.io.to(code).emit(SocketEvents.GAME_FINISHED, {
        finalRanking,
        podium,
        questionHistory,
      });

      console.log(`Game ${code} finished`);
    } catch (error) {
      console.error('Error finishing game:', error);
    }
  }
}
