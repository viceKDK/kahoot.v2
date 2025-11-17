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
   * @returns Juego creado con QR y URL
   */
  async createGame(
    quizId: string,
    hostName: string,
    baseUrl: string
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

    // Crear jugador host
    const hostPlayer: Player = {
      id: `host_${Date.now()}`,
      name: hostName,
      avatar: this.getRandomAvatar(),
      status: PlayerStatus.READY,
      score: 0,
      streak: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      accuracy: 0,
      isHost: true,
      joinedAt: new Date(),
    };

    // Crear juego en memoria
    const game: Game = {
      id: code, // Usar código como ID
      code,
      quizId,
      quiz,
      hostId: hostPlayer.id,
      status: GameStatus.LOBBY,
      players: [hostPlayer],
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
   * Un jugador envía una respuesta
   * @param code - Código del juego
   * @param playerId - ID del jugador
   * @param optionId - ID de la opción seleccionada
   * @param timeElapsed - Tiempo que tardó en responder (ms)
   * @returns Respuesta procesada
   */
  submitAnswer(
    code: string,
    playerId: string,
    optionId: string,
    timeElapsed: number
  ): PlayerAnswer {
    const game = this.activeGames.get(code);
    if (!game) {
      throw new Error('Game not found');
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
    if (!currentQuestion) {
      throw new Error('No current question');
    }

    // Verificar si ya respondió
    const existingResults = game.results[game.currentQuestionIndex];
    if (existingResults) {
      const alreadyAnswered = existingResults.playerAnswers.some(
        (a) => a.playerId === playerId
      );
      if (alreadyAnswered) {
        throw new Error('Already answered this question');
      }
    }

    // Verificar si la opción es correcta
    const selectedOption = currentQuestion.options.find((o) => o.id === optionId);
    if (!selectedOption) {
      throw new Error('Invalid option');
    }

    const isCorrect = selectedOption.isCorrect;

    // Calcular puntos
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = ScoringService.calculatePoints(
        currentQuestion.timeLimit,
        timeElapsed,
        player.streak
      );
      player.correctAnswers++;
    }

    player.totalAnswers++;
    player.score += pointsEarned;
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

    game.results[game.currentQuestionIndex].playerAnswers.push(answer);

    // Actualizar votos
    const votes = game.results[game.currentQuestionIndex].optionVotes;
    votes[optionId] = (votes[optionId] || 0) + 1;

    return answer;
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
