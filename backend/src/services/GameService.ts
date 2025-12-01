// ============================================================================
// GAME SERVICE
// GRASP: Controller - Coordina toda la lógica del juego
// SOLID: Single Responsibility - Gestiona el estado y flujo del juego
// ============================================================================

import {
  Game,
  Player,
  PlayerAnswer,
  QuestionResults,
  RankingEntry,
  GameStatus,
  PlayerStatus,
  AVATAR_PRESETS,
  GameMode,
} from '../../../shared/types';
import QuizRepository from '../models/QuizRepository';
import GameSessionRepository from '../models/GameSessionRepository';
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
      currentQuestionIndex: -1,
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
   * @returns Juego y jugador creado
   */
  joinGame(code: string, playerName: string): { game: Game; player: Player } {
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
    game.currentQuestionIndex = 0;

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

    // Actualizar en BD
    await GameSessionRepository.updateSessionStatus(code, GameStatus.FINISHED);

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
      currentQuestionIndex: game.currentQuestionIndex,
      totalQuestions: game.quiz.questions.length,
      playerStats,
    };
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
