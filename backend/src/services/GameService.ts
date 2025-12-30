// ============================================================================
// GAME SERVICE
// GRASP: Controller - Coordina toda la lógica del juego
// SOLID: Single Responsibility - Gestiona el estado y flujo del juego
// ============================================================================

import {
  Game,
  Player,
  PlayerAnswer,
  PlayerGameState,
  QuestionResults,
  RankingEntry,
  GameStatus,
  PlayerStatus,
  AVATAR_PRESETS,
  GameMode,
} from '../../../shared/types';
import QuizRepository from '../models/QuizRepository';
import GameSessionRepository from '../models/GameSessionRepository';
import PlayerRepository from '../models/PlayerRepository';
import ScoringService from './ScoringService';
import { generateGameCode } from '../utils/codeGenerator';
import QRCode from 'qrcode';

export class GameService {
  // Almacén en memoria de juegos activos (no persisten en BD)
  private activeGames: Map<string, Game> = new Map();

  /**
   * Crea un nuevo juego
   * @param quizId - ID del quiz a jugar
   * @param hostName - Nombre del host
   * @param baseUrl - URL base para generar el link de invitación
   * @param mode - Modo de juego (FAST / WAIT_ALL)
   * @returns Juego creado con QR y URL
   */
  async createGame(
    quizId: string,
    hostName: string,
    baseUrl: string,
    mode: GameMode = GameMode.FAST
  ): Promise<{ game: Game; qrCode: string; joinUrl: string }> {
    // Obtener quiz de la BD
    const quiz = await QuizRepository.getQuizById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Generar código único
    let code = generateGameCode();
    while (await GameSessionRepository.codeExists(code)) {
      code = generateGameCode();
    }

    // Generar ID del host (pero no crear jugador)
    const hostId = `host_${Date.now()}`;

    // Crear juego en memoria (sin el host como jugador)
    const game: Game = {
      id: code, // Usar código como ID
      code,
      quizId,
      quiz,
      hostId,
      hostName,
      status: GameStatus.LOBBY,
      mode,
      players: [],
      playerStates: {}, // Estados individuales por jugador
      currentQuestionIndex: -1, // DEPRECATED: mantener por compatibilidad
      results: [],
      createdAt: new Date(),
    };

    this.activeGames.set(code, game);

    // Guardar sesión en BD (solo metadata)
    await GameSessionRepository.createSession(code, quizId, hostName);

    // Generar QR y URL
    const joinUrl = `${baseUrl}/join/${code}`;
    const qrCode = await QRCode.toDataURL(joinUrl, {
      width: 300,
      margin: 2,
    });

    return { game, qrCode, joinUrl };
  }

  /**
   * Un jugador se une al juego
   * @param code - Código del juego
   * @param playerName - Nombre del jugador
   * @param supabaseUserId - ID opcional de Supabase para persistencia
   * @returns Juego y jugador creado
   */
  joinGame(code: string, playerName: string, supabaseUserId?: string): { game: Game; player: Player } {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== GameStatus.LOBBY) {
      throw new Error('Game already started');
    }

    // Verificar que el nombre no esté duplicado
    const nameExists = game.players.some(
      (p) => p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (nameExists) {
      throw new Error('Name already taken');
    }

    // Crear jugador
    const player: Player = {
      id: `player_${Date.now()}_${Math.random()}`,
      name: playerName,
      avatar: this.getRandomAvatar(),
      status: PlayerStatus.WAITING,
      score: 0,
      streak: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      accuracy: 0,
      isHost: false,
      joinedAt: new Date(),
      supabaseUserId, // Guardamos el ID si existe
    };

    game.players.push(player);

    return { game, player };
  }

  /**
   * Inicia el juego (solo el host puede hacerlo)
   * @param code - Código del juego
   * @param hostId - ID del host
   */
  async startGame(code: string, hostId: string): Promise<Game> {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.hostId !== hostId) {
      throw new Error('Only host can start the game');
    }

    if (game.status !== GameStatus.LOBBY) {
      throw new Error('Game already started');
    }

    game.status = GameStatus.PLAYING;
    game.currentQuestionIndex = 0; // DEPRECATED: mantener por compatibilidad

    // Inicializar estado individual para cada jugador
    game.players.forEach((player) => {
      game.playerStates[player.id] = {
        playerId: player.id,
        currentQuestionIndex: -1, // Aún no ha empezado ninguna pregunta
        status: 'WAITING_RESULTS', // Esperando que inicie la primera pregunta
        hasAnsweredCurrent: false,
        answers: [],
        lastActivityAt: Date.now(),
      };
    });

    // Actualizar en BD
    await GameSessionRepository.updateSessionStatus(
      code,
      GameStatus.PLAYING,
      game.players.length
    );

    return game;
  }

  /**
   * Inicia la siguiente pregunta
   * @param code - Código del juego
   * @returns Juego actualizado
   */
  nextQuestion(code: string): Game {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    game.status = GameStatus.QUESTION;
    game.questionStartTime = Date.now();

    return game;
  }

  /**
   * Registra la respuesta de un jugador
   * @param gameId - Código del juego
   * @param playerId - ID del jugador
   * @param optionId - Opción elegida
   * @param timeElapsed - Tiempo transcurrido
   * @returns Respuesta y si todos los jugadores ya respondieron
   */
  submitAnswer(
    gameId: string,
    playerId: string,
    optionId: string,
    timeElapsed: number
  ): { answer: PlayerAnswer; allAnswered: boolean } {
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
    if (!currentQuestion) {
      throw new Error('No current question');
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const selectedOption = currentQuestion.options.find((o) => o.id === optionId);
    if (!selectedOption) {
      throw new Error('Option not found');
    }

    const isCorrect = selectedOption.isCorrect;
    const pointsEarned = isCorrect
      ? ScoringService.calculatePoints(
          currentQuestion.timeLimit,
          timeElapsed,
          player.streak
        )
      : 0;

    // Actualizar estadísticas del jugador
    player.totalAnswers += 1;
    if (isCorrect) {
      player.correctAnswers += 1;
      player.score += pointsEarned;
    }
    player.streak = ScoringService.updateStreak(player.streak, isCorrect);
    player.accuracy = ScoringService.calculateAccuracy(
      player.correctAnswers,
      player.totalAnswers
    );

    // Crear respuesta
    const answer: PlayerAnswer = {
      playerId,
      questionId: currentQuestion.id,
      optionId,
      answeredAt: Date.now(),
      timeElapsed,
      isCorrect,
      pointsEarned,
    };

    // Guardar en resultados
    if (!game.results[game.currentQuestionIndex]) {
      game.results[game.currentQuestionIndex] = {
        questionId: currentQuestion.id,
        totalPlayers: game.players.length,
        optionVotes: {},
        correctOptionId: currentQuestion.options.find((o) => o.isCorrect)!.id,
        playerAnswers: [],
      };
    }

    const questionResults = game.results[game.currentQuestionIndex];
    questionResults.playerAnswers.push(answer);

    // Actualizar votos
    const votes = questionResults.optionVotes;
    votes[optionId] = (votes[optionId] || 0) + 1;

    // Consideramos "todos respondieron" cuando:
    // - Hay al menos un jugador, y
    // - El número de respuestas alcanza el número de jugadores
    const totalPlayers = game.players.length;
    const allAnswered =
      totalPlayers > 0 &&
      questionResults.playerAnswers.length >= totalPlayers;

    return { answer, allAnswered };
  }

  /**
   * Finaliza la pregunta actual
   * @param code - Código del juego
   * @returns Resultados de la pregunta
   */
  endQuestion(code: string): QuestionResults {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    game.status = GameStatus.RESULTS;

    const results = game.results[game.currentQuestionIndex];
    if (!results) {
      throw new Error('No results for current question');
    }

    return results;
  }

  /**
   * Obtiene el ranking actual
   * @param code - Código del juego
   * @returns Ranking completo y top 5
   */
  getRanking(code: string): { ranking: RankingEntry[]; topPlayers: RankingEntry[] } {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    // Ordenar jugadores por puntaje (mayor a menor)
    const sortedPlayers = [...game.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Desempate por accuracy
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      // Desempate por tiempo de ingreso
      return a.joinedAt.getTime() - b.joinedAt.getTime();
    });

    const ranking: RankingEntry[] = sortedPlayers.map((player, index) => ({
      player,
      rank: index + 1,
    }));

    const topPlayers = ranking.slice(0, 5);

    return { ranking, topPlayers };
  }

  /**
   * Avanza a la siguiente pregunta
   * @param code - Código del juego
   * @returns true si hay más preguntas, false si terminó
   */
  moveToNextQuestion(code: string): boolean {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    game.currentQuestionIndex++;

    if (game.currentQuestionIndex >= game.quiz.questions.length) {
      return false; // No hay más preguntas
    }

    return true;
  }

  /**
   * Finaliza el juego
   * @param code - Código del juego
   * @returns Datos finales del juego
   */
  async finishGame(code: string): Promise<{
    finalRanking: RankingEntry[];
    podium: RankingEntry[];
    questionHistory: { question: any; results: QuestionResults }[];
  }> {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    game.status = GameStatus.FINISHED;
    game.finishedAt = new Date();

    const { ranking } = this.getRanking(code);
    const podium = ranking.slice(0, 3);

    const questionHistory = game.quiz.questions.map((question, index) => ({
      question,
      results: game.results[index],
    }));

    // Actualizar en BD metadata de la sesión
    await GameSessionRepository.updateSessionStatus(code, GameStatus.FINISHED);

    // PERSISTENCIA DE STATS: Actualizar estadísticas de jugadores registrados
    const updateStatsPromises = ranking.map(async (entry) => {
      const { player, rank } = entry;
      if (player.supabaseUserId) {
        try {
          // Calcular XP ganado: Score / 10 + Bonus por podio
          const podiumBonus = rank === 1 ? 500 : rank === 2 ? 300 : rank === 3 ? 100 : 0;
          const xpEarned = Math.floor(player.score / 10) + podiumBonus;

          await PlayerRepository.updatePlayerStats({
            userId: player.supabaseUserId,
            isWin: rank === 1,
            isPodium: rank <= 3,
            questionsAnswered: player.totalAnswers,
            correctAnswers: player.correctAnswers,
            bestStreak: player.streak, // Nota: esto debería ser la racha máxima alcanzada en la partida
            xpEarned
          });
          console.log(`✅ Stats updated for user ${player.supabaseUserId}`);
        } catch (error) {
          console.error(`❌ Failed to update stats for user ${player.supabaseUserId}:`, error);
        }
      }
    });

    await Promise.all(updateStatsPromises);

    return { finalRanking: ranking, podium, questionHistory };
  }

  /**
   * Obtiene un juego por código
   * @param code - Código del juego
   * @returns Juego o null
   */
  getGame(code: string): Game | null {
    return this.activeGames.get(code) || null;
  }

  /**
   * Elimina un jugador del juego
   * @param code - Código del juego
   * @param playerId - ID del jugador
   */
  removePlayer(code: string, playerId: string): void {
    const game = this.activeGames.get(code);
    if (!game) return;

    game.players = game.players.filter((p) => p.id !== playerId);

    // Si no quedan jugadores, eliminar el juego
    if (game.players.length === 0) {
      this.activeGames.delete(code);
    }
  }

  /**
   * Obtiene estadísticas en tiempo real para el host
   * @param code - Código del juego
   * @returns Estadísticas del juego
   */
  getGameStats(code: string): {
    currentQuestionIndex: number;
    totalQuestions: number;
    playerStats: Array<{
      player: Player;
      correctAnswers: number;
      incorrectAnswers: number;
      totalAnswers: number;
      correctPercentage: number;
      incorrectPercentage: number;
      score: number;
      accuracy: number;
    }>;
  } | null {
    const game = this.activeGames.get(code);
    if (!game) {
      return null;
    }

    // Derivar el índice de pregunta más avanzado entre los jugadores (WAIT_ALL)
    const playerQuestionIndices = Object.values(game.playerStates || {}).map(
      (ps) => ps.currentQuestionIndex ?? -1
    );
    const derivedCurrentIndex =
      playerQuestionIndices.length > 0 ? Math.max(...playerQuestionIndices) : game.currentQuestionIndex;

    const playerStats = game.players.map((player) => {
      const incorrectAnswers = player.totalAnswers - player.correctAnswers;
      const correctPercentage = player.totalAnswers > 0
        ? (player.correctAnswers / player.totalAnswers) * 100
        : 0;
      const incorrectPercentage = player.totalAnswers > 0
        ? (incorrectAnswers / player.totalAnswers) * 100
        : 0;

      return {
        player,
        correctAnswers: player.correctAnswers,
        incorrectAnswers,
        totalAnswers: player.totalAnswers,
        correctPercentage: Math.round(correctPercentage * 10) / 10,
        incorrectPercentage: Math.round(incorrectPercentage * 10) / 10,
        score: player.score,
        accuracy: player.accuracy,
      };
    });

    // Ordenar por puntaje descendente
    playerStats.sort((a, b) => b.score - a.score);

    return {
      currentQuestionIndex: derivedCurrentIndex,
      totalQuestions: game.quiz.questions.length,
      playerStats,
    };
  }

  // ============================================================================
  // MÉTODOS PARA ESTADO POR JUGADOR
  // ============================================================================

  /**
   * Obtiene el estado de un jugador específico
   * @param code - Código del juego
   * @param playerId - ID del jugador
   * @returns Estado del jugador o null
   */
  getPlayerState(code: string, playerId: string): PlayerGameState | null {
    const game = this.activeGames.get(code);
    if (!game) return null;
    return game.playerStates[playerId] || null;
  }

  /**
   * Inicia una pregunta para un jugador específico
   * @param code - Código del juego
   * @param playerId - ID del jugador
   * @returns Estado actualizado del jugador
   */
  startPlayerQuestion(code: string, playerId: string): PlayerGameState {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    const playerState = game.playerStates[playerId];
    if (!playerState) {
      throw new Error('Player state not found');
    }

    // Avanzar a la siguiente pregunta
    playerState.currentQuestionIndex++;

    // Si no hay mÃ¡s preguntas, marcar como terminado de forma segura
    if (!game.quiz.questions || playerState.currentQuestionIndex >= game.quiz.questions.length) {
      playerState.status = 'FINISHED';
      playerState.questionStartTime = undefined;
      playerState.hasAnsweredCurrent = false;
      playerState.lastActivityAt = Date.now();
      return playerState;
    }

    playerState.status = 'QUESTION';
    playerState.questionStartTime = Date.now();
    playerState.hasAnsweredCurrent = false;
    playerState.lastActivityAt = Date.now();

    return playerState;
  }

  /**
   * Registra la respuesta de un jugador (versión nueva con estado individual)
   * @param code - Código del juego
   * @param playerId - ID del jugador
   * @param optionId - Opción elegida
   * @param timeElapsed - Tiempo transcurrido
   * @returns Respuesta y estado actualizado del jugador
   */
  submitPlayerAnswer(
    code: string,
    playerId: string,
    optionId: string,
    timeElapsed: number
  ): { answer: PlayerAnswer; playerState: PlayerGameState } {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    const playerState = game.playerStates[playerId];
    if (!playerState) {
      throw new Error('Player state not found');
    }

    const currentQuestion = game.quiz.questions[playerState.currentQuestionIndex];
    if (!currentQuestion) {
      throw new Error('No current question for this player');
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const selectedOption = currentQuestion.options.find((o) => o.id === optionId);
    if (!selectedOption) {
      throw new Error('Option not found');
    }

    // ANTI-CHEAT: Validar el tiempo transcurrido
    // El backend tiene la autoridad sobre cuándo empezó la pregunta
    let validatedTimeElapsed = timeElapsed;
    if (playerState.questionStartTime) {
      const serverTimeElapsed = Date.now() - playerState.questionStartTime;
      
      // Permitimos un margen de error (latencia) de 2000ms a favor del cliente
      // Si el cliente dice que tardó 1s pero el servidor dice 5s -> OK (pudo ser lag de red al recibir la pregunta)
      // Si el cliente dice que tardó 0.1s pero el servidor dice 0.05s -> IMPOSIBLE (cheat)
      // Si el cliente dice que tardó 10s pero el servidor dice 2s -> IMPOSIBLE (cheat o reloj desincronizado)
      
      // Regla 1: No puede ser negativo
      if (validatedTimeElapsed < 0) validatedTimeElapsed = 0;

      // Regla 2: No puede ser mayor al tiempo límite (+ un buffer de latencia de 3s)
      const maxAllowed = currentQuestion.timeLimit + 3000;
      if (validatedTimeElapsed > maxAllowed) validatedTimeElapsed = maxAllowed;

      // Regla 3 (La más importante): Si el servidor dice que apenas pasaron 100ms
      // y el cliente dice que pasaron 5000ms (raro) o viceversa, ajustamos.
      // Pero lo crítico es que no diga "tardé 0" si no ha pasado tiempo.
      // Simplemente usaremos Math.max para asegurar que al menos haya pasado lo que dice el servidor menos latencia.
      // O mejor aún: Usamos el tiempo del servidor como referencia principal si hay discrepancia grande.
      
      // Estrategia simple: Si la diferencia es > 2 segundos, usamos el tiempo del servidor
      if (Math.abs(serverTimeElapsed - validatedTimeElapsed) > 2000) {
        console.warn(`⚠️ Time discrepancy detected for player ${playerId}: Client=${validatedTimeElapsed}, Server=${serverTimeElapsed}. Using Server time.`);
        validatedTimeElapsed = serverTimeElapsed;
      }
    }

    const isCorrect = selectedOption.isCorrect;
    const pointsEarned = isCorrect
      ? ScoringService.calculatePoints(
          currentQuestion.timeLimit,
          validatedTimeElapsed,
          player.streak
        )
      : 0;

    // Actualizar estadísticas del jugador
    player.totalAnswers += 1;
    if (isCorrect) {
      player.correctAnswers += 1;
      player.score += pointsEarned;
    }
    player.streak = ScoringService.updateStreak(player.streak, isCorrect);
    player.accuracy = ScoringService.calculateAccuracy(
      player.correctAnswers,
      player.totalAnswers
    );

    // Crear respuesta
    const answer: PlayerAnswer = {
      playerId,
      questionId: currentQuestion.id,
      optionId,
      answeredAt: Date.now(),
      timeElapsed,
      isCorrect,
      pointsEarned,
    };

    // Guardar en estado del jugador
    playerState.answers.push(answer);
    playerState.hasAnsweredCurrent = true;
    playerState.status = 'WAITING_RESULTS';
    playerState.lastActivityAt = Date.now();

    // También guardar en resultados globales (para estadísticas)
    if (!game.results[playerState.currentQuestionIndex]) {
      game.results[playerState.currentQuestionIndex] = {
        questionId: currentQuestion.id,
        totalPlayers: game.players.length,
        optionVotes: {},
        correctOptionId: currentQuestion.options.find((o) => o.isCorrect)!.id,
        playerAnswers: [],
      };
    }

    const questionResults = game.results[playerState.currentQuestionIndex];
    questionResults.playerAnswers.push(answer);

    // Actualizar votos
    const votes = questionResults.optionVotes;
    votes[optionId] = (votes[optionId] || 0) + 1;

    return { answer, playerState };
  }

  /**
   * Avanza un jugador a la siguiente pregunta
   * @param code - Codigo del juego
   * @param playerId - ID del jugador
   * @returns true si avanzo, false si ya termino el juego
   */
  advancePlayerToNextQuestion(code: string, playerId: string): boolean {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    const playerState = game.playerStates[playerId];
    if (!playerState) {
      throw new Error('Player state not found');
    }

    // Verificar si hay más preguntas
    if (playerState.currentQuestionIndex + 1 >= game.quiz.questions.length) {
      playerState.status = 'FINISHED';
      return false;
    }

    // Todavia hay preguntas; startQuestionForPlayer gestionara el avance y el emit
    return true;
  }

  /**
   * Verifica si un jugador ha terminado todas las preguntas
   * @param code - Codigo del juego
   * @param playerId - ID del jugador
   * @returns true si termino, false si aun tiene preguntas
   */
  hasPlayerFinished(code: string, playerId: string): boolean {
    const playerState = this.getPlayerState(code, playerId);
    if (!playerState) return false;
    return playerState.status == 'FINISHED';
  }

  /**
   * Verifica si todos los jugadores han terminado el juego
   * @param code - Código del juego
   * @returns true si todos terminaron
   */
  haveAllPlayersFinished(code: string): boolean {
    const game = this.activeGames.get(code);
    if (!game) return false;

    return game.players.every((player) =>
      this.hasPlayerFinished(code, player.id)
    );
  }

  /**
   * Obtiene un avatar aleatorio no usado en el juego
   * @param usedAvatars - Avatares ya en uso (opcional)
   * @returns Avatar aleatorio
   */
  private getRandomAvatar(): (typeof AVATAR_PRESETS)[0] {
    const randomIndex = Math.floor(Math.random() * AVATAR_PRESETS.length);
    return { ...AVATAR_PRESETS[randomIndex] };
  }
}

// Singleton
export default new GameService();


