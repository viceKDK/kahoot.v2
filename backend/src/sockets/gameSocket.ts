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
} from '../../../shared/types';
import GameService from '../services/GameService';
import { createRateLimitedEventHandler } from '../middleware/socketProtection';
import { socketValidators } from '../middleware/validators';

export class GameSocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Configura todos los event handlers
   */
  setupHandlers(socket: Socket): void {
    // Host crea un juego
    socket.on(
      SocketEvents.HOST_CREATE_GAME,
      createRateLimitedEventHandler<CreateGamePayload>(
        SocketEvents.HOST_CREATE_GAME,
        async (socket: Socket, payload: CreateGamePayload) => {
          try {
            // Validar quizId
            const quizIdValidation = socketValidators.validateQuizId(payload.quizId);
            if (!quizIdValidation.valid) {
              const errorPayload: ErrorPayload = { message: quizIdValidation.error! };
              socket.emit(SocketEvents.ERROR, errorPayload);
              return;
            }

            // Validar hostName
            const hostNameValidation = socketValidators.validatePlayerName(payload.hostName);
            if (!hostNameValidation.valid) {
              const errorPayload: ErrorPayload = { message: hostNameValidation.error! };
              socket.emit(SocketEvents.ERROR, errorPayload);
              return;
            }

            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const { game, qrCode, joinUrl } = await GameService.createGame(
              payload.quizId,
              payload.hostName,
              baseUrl
            );

            // El host se une a la room del juego
            socket.join(game.code);

            const response: CreateGameResponse = { game, qrCode, joinUrl };
            socket.emit(SocketEvents.GAME_CREATED, response);

            console.log(`✅ Game created: ${game.code} by ${payload.hostName}`);
          } catch (error: any) {
            const errorPayload: ErrorPayload = {
              message: error.message || 'Failed to create game',
            };
            socket.emit(SocketEvents.ERROR, errorPayload);
            console.error('Error creating game:', error);
          }
        }
      )
    );

    // Jugador se une a un juego
    socket.on(
      SocketEvents.PLAYER_JOIN_GAME,
      createRateLimitedEventHandler<JoinGamePayload>(
        SocketEvents.PLAYER_JOIN_GAME,
        (socket: Socket, payload: JoinGamePayload) => {
          try {
            // Validar código de juego
            const codeValidation = socketValidators.validateGameCode(payload.code);
            if (!codeValidation.valid) {
              const errorPayload: ErrorPayload = { message: codeValidation.error! };
              socket.emit(SocketEvents.ERROR, errorPayload);
              return;
            }

            // Validar nombre de jugador
            const nameValidation = socketValidators.validatePlayerName(payload.playerName);
            if (!nameValidation.valid) {
              const errorPayload: ErrorPayload = { message: nameValidation.error! };
              socket.emit(SocketEvents.ERROR, errorPayload);
              return;
            }

            const { game, player } = GameService.joinGame(payload.code, payload.playerName);

            // El jugador se une a la room del juego
            socket.join(game.code);

            const response: JoinGameResponse = { game, player };
            socket.emit(SocketEvents.PLAYER_JOINED, response);

            // Notificar a todos en la sala que un jugador se unió
            this.io.to(game.code).emit(SocketEvents.GAME_UPDATED, game);

            console.log(`✅ ${player.name} joined game ${game.code}`);
          } catch (error: any) {
            const errorPayload: ErrorPayload = {
              message: error.message || 'Failed to join game',
            };
            socket.emit(SocketEvents.ERROR, errorPayload);
            console.error('Error joining game:', error);
          }
        }
      )
    );

    // Host inicia el juego
    socket.on(
      SocketEvents.HOST_START_GAME,
      createRateLimitedEventHandler<{ code: string; hostId: string }>(
        SocketEvents.HOST_START_GAME,
        async (socket: Socket, payload: { code: string; hostId: string }) => {
          try {
            // Validar código de juego
            const codeValidation = socketValidators.validateGameCode(payload.code);
            if (!codeValidation.valid) {
              const errorPayload: ErrorPayload = { message: codeValidation.error! };
              socket.emit(SocketEvents.ERROR, errorPayload);
              return;
            }

            const game = await GameService.startGame(payload.code, payload.hostId);

            // Notificar a todos que el juego inició
            this.io.to(game.code).emit(SocketEvents.GAME_STARTED, game);

            // Iniciar la primera pregunta automáticamente después de 2 segundos
            setTimeout(() => {
              this.startQuestion(game.code);
            }, 2000);

            console.log(`✅ Game ${game.code} started`);
          } catch (error: any) {
            const errorPayload: ErrorPayload = {
              message: error.message || 'Failed to start game',
            };
            socket.emit(SocketEvents.ERROR, errorPayload);
            console.error('Error starting game:', error);
          }
        }
      )
    );

    // Jugador envía respuesta
    socket.on(
      SocketEvents.PLAYER_SUBMIT_ANSWER,
      createRateLimitedEventHandler<SubmitAnswerPayload>(
        SocketEvents.PLAYER_SUBMIT_ANSWER,
        (socket: Socket, payload: SubmitAnswerPayload) => {
          try {
            // Validar optionId
            const optionValidation = socketValidators.validateOptionIndex(payload.optionId);
            if (!optionValidation.valid) {
              const errorPayload: ErrorPayload = { message: optionValidation.error! };
              socket.emit(SocketEvents.ERROR, errorPayload);
              return;
            }

            const answer = GameService.submitAnswer(
              payload.gameId,
              payload.playerId,
              payload.optionId,
              payload.timeElapsed
            );

            // Confirmar al jugador que su respuesta fue recibida
            socket.emit('answer:submitted', { answer });

            console.log(
              `✅ Answer submitted by player ${payload.playerId} in game ${payload.gameId}`
            );
          } catch (error: any) {
            const errorPayload: ErrorPayload = {
              message: error.message || 'Failed to submit answer',
            };
            socket.emit(SocketEvents.ERROR, errorPayload);
            console.error('Error submitting answer:', error);
          }
        }
      )
    );

    // Host pasa a la siguiente pregunta
    socket.on(
      SocketEvents.HOST_NEXT_QUESTION,
      createRateLimitedEventHandler<{ code: string }>(
        SocketEvents.HOST_NEXT_QUESTION,
        (socket: Socket, payload: { code: string }) => {
          try {
            // Validar código de juego
            const codeValidation = socketValidators.validateGameCode(payload.code);
            if (!codeValidation.valid) {
              const errorPayload: ErrorPayload = { message: codeValidation.error! };
              socket.emit(SocketEvents.ERROR, errorPayload);
              return;
            }

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
        }
      )
    );

    // Host termina el juego manualmente
    socket.on(
      SocketEvents.HOST_END_GAME,
      createRateLimitedEventHandler<{ code: string }>(
        SocketEvents.HOST_END_GAME,
        (socket: Socket, payload: { code: string }) => {
          try {
            // Validar código de juego
            const codeValidation = socketValidators.validateGameCode(payload.code);
            if (!codeValidation.valid) {
              const errorPayload: ErrorPayload = { message: codeValidation.error! };
              socket.emit(SocketEvents.ERROR, errorPayload);
              return;
            }

            this.finishGame(payload.code);
          } catch (error: any) {
            const errorPayload: ErrorPayload = {
              message: error.message || 'Failed to end game',
            };
            socket.emit(SocketEvents.ERROR, errorPayload);
            console.error('Error ending game:', error);
          }
        }
      )
    );

    // Jugador se desconecta
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
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

      // Enviar pregunta a todos los jugadores
      this.io.to(code).emit(SocketEvents.GAME_QUESTION_START, {
        question: currentQuestion,
        questionNumber: game.currentQuestionIndex + 1,
        totalQuestions: game.quiz.questions.length,
        startTime: game.questionStartTime!,
      });

      // Terminar pregunta automáticamente después del tiempo límite + 2 segundos de buffer
      setTimeout(() => {
        this.endQuestion(code);
      }, currentQuestion.timeLimit + 2000);

      console.log(`✅ Question ${game.currentQuestionIndex + 1} started in game ${code}`);
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

      // Enviar fin de pregunta
      this.io.to(code).emit(SocketEvents.GAME_QUESTION_END, {
        questionId: currentQuestion.id,
        correctOptionId: results.correctOptionId,
      });

      // Mostrar resultados después de 1 segundo
      setTimeout(() => {
        this.io.to(code).emit(SocketEvents.GAME_SHOW_RESULTS, {
          questionResults: results,
          question: currentQuestion,
        });

        // Mostrar ranking después de 3 segundos
        setTimeout(() => {
          this.showRanking(code);
        }, 3000);
      }, 1000);

      console.log(`✅ Question ${game.currentQuestionIndex + 1} ended in game ${code}`);
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

      console.log(`✅ Ranking shown for game ${code}`);
    } catch (error) {
      console.error('Error showing ranking:', error);
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

      console.log(`✅ Game ${code} finished`);
    } catch (error) {
      console.error('Error finishing game:', error);
    }
  }
}
