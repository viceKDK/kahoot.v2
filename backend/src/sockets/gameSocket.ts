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
  private questionTimeouts: Map<string, NodeJS.Timeout> = new Map();

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

        const response: JoinGameResponse = { game, player };
        socket.emit(SocketEvents.PLAYER_JOINED, response);

        // Notificar a todos los clientes que el juego se actualizó
        this.io.emit(SocketEvents.GAME_UPDATED, game);

        console.log(`Player ${player.name} joined game ${game.code}`);
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

          // Iniciar la primera pregunta automáticamente después de 2 segundos
          setTimeout(() => {
            this.startQuestion(game.code);
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

    // Jugador envía respuesta
    socket.on(SocketEvents.PLAYER_SUBMIT_ANSWER, (payload: SubmitAnswerPayload) => {
      try {
        const { answer, allAnswered } = GameService.submitAnswer(
          payload.gameId,
          payload.playerId,
          payload.optionId,
          payload.timeElapsed
        );

        // Confirmar al jugador que su respuesta fue recibida
        socket.emit('answer:submitted', { answer });

        // Enviar estadísticas actualizadas al host
        this.sendStatsToHost(payload.gameId);

        const game = GameService.getGame(payload.gameId);

        // Lógica de modos:
        // FAST     -> en cuanto entra la PRIMERA respuesta, se termina la pregunta para todos
        // WAIT_ALL -> se termina cuando todos los jugadores han respondido (allAnswered)
        if (game) {
          if (game.mode === GameMode.FAST) {
            const currentResults =
              game.results[game.currentQuestionIndex];
            const answersCount = currentResults?.playerAnswers.length ?? 0;

            // Si esta es la primera respuesta de la pregunta, cerramos ya
            if (answersCount === 1) {
              const timeout = this.questionTimeouts.get(payload.gameId);
              if (timeout) {
                clearTimeout(timeout);
                this.questionTimeouts.delete(payload.gameId);
              }
              this.endQuestion(payload.gameId);
            }
          } else if (game.mode === GameMode.WAIT_ALL && allAnswered) {
            const timeout = this.questionTimeouts.get(payload.gameId);
            if (timeout) {
              clearTimeout(timeout);
              this.questionTimeouts.delete(payload.gameId);
            }
            this.endQuestion(payload.gameId);
          }
        }

        console.log(
          `Answer submitted by player ${payload.playerId} in game ${payload.gameId}`
        );
      } catch (error: any) {
        const errorPayload: ErrorPayload = {
          message: error.message || 'Failed to submit answer',
        };
        socket.emit(SocketEvents.ERROR, errorPayload);
        console.error('Error submitting answer:', error);
      }
    });

    // Host pasa a la siguiente pregunta
    socket.on(SocketEvents.HOST_NEXT_QUESTION, (payload: { code: string }) => {
      try {
        const hasMore = GameService.moveToNextQuestion(payload.code);

        if (hasMore) {
          this.startQuestion(payload.code);
        } else {
          this.finishGame(payload.code);
        }
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
      // Aquí podrías manejar la desconexión del jugador si guardas el mapping socket.id -> playerId
    });
  }

  /**
   * Inicia una pregunta
   * @param code - Código del juego
   */
  private startQuestion(code: string): void {
    try {
      const game = GameService.nextQuestion(code);
      const currentQuestion = game.quiz.questions[game.currentQuestionIndex];

      if (!currentQuestion) {
        console.error(
          'No current question found for game',
          code,
          'index',
          game.currentQuestionIndex
        );
        return;
      }

      // Enviar pregunta a todos los jugadores
      this.io.to(code).emit(SocketEvents.GAME_QUESTION_START, {
        question: currentQuestion,
        questionNumber: game.currentQuestionIndex + 1,
        totalQuestions: game.quiz.questions.length,
        startTime: game.questionStartTime!,
      });

      // Enviar estadísticas iniciales al host
      this.sendStatsToHost(code);

      // Limpiar timeout anterior si existía
      const existingTimeout = this.questionTimeouts.get(code);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Terminar pregunta automáticamente después del tiempo límite + 2 segundos de buffer
      const timeout = setTimeout(() => {
        this.endQuestion(code);
        this.questionTimeouts.delete(code);
      }, currentQuestion.timeLimit + 2000);

      this.questionTimeouts.set(code, timeout);

      console.log(`Question ${game.currentQuestionIndex + 1} started in game ${code}`);
    } catch (error) {
      console.error('Error starting question:', error);
    }
  }

  /**
   * Termina una pregunta y muestra resultados
   * @param code - Código del juego
   */
  private endQuestion(code: string): void {
    try {
      const game = GameService.getGame(code);
      if (!game) return;

      const results = GameService.endQuestion(code);
      const currentQuestion = game.quiz.questions[game.currentQuestionIndex];

      if (!currentQuestion) {
        console.error(
          'No current question found on endQuestion for game',
          code,
          'index',
          game.currentQuestionIndex
        );
        return;
      }

      // Enviar fin de pregunta
      this.io.to(code).emit(SocketEvents.GAME_QUESTION_END, {
        questionId: currentQuestion.id,
        correctOptionId: results.correctOptionId,
      });

      // Enviar estadísticas finales al host
      this.sendStatsToHost(code);

      // Mostrar resultados después de 1 segundo
      setTimeout(() => {
        this.io.to(code).emit(SocketEvents.GAME_SHOW_RESULTS, {
          questionResults: results,
          question: currentQuestion,
        });

        // Enviar estadísticas al host después de mostrar resultados
        this.sendStatsToHost(code);

        // Mostrar ranking después de 3 segundos
        setTimeout(() => {
          this.showRanking(code);
        }, 3000);
      }, 1000);

      console.log(`Question ${game.currentQuestionIndex + 1} ended in game ${code}`);
    } catch (error) {
      console.error('Error ending question:', error);
    }
  }

  /**
   * Muestra el ranking actual
   * @param code - Código del juego
   */
  private showRanking(code: string): void {
    try {
      const { ranking, topPlayers } = GameService.getRanking(code);

      this.io.to(code).emit(SocketEvents.GAME_SHOW_RANKING, {
        ranking,
        topPlayers,
      });

      console.log(`Ranking shown for game ${code}`);
    } catch (error) {
      console.error('Error showing ranking:', error);
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
