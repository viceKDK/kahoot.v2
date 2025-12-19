// ============================================================================
// SHARED TYPES - QuizArena
// Tipos compartidos entre Frontend y Backend (GRASP: Information Expert)
// ============================================================================

export enum GameStatus {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  QUESTION = 'QUESTION',
  RESULTS = 'RESULTS',
  FINISHED = 'FINISHED'
}

export enum GameMode {
  FAST = 'FAST',       // Cada jugador avanza a su propio ritmo
  WAIT_ALL = 'WAIT_ALL' // Todos los jugadores avanzan juntos (esperan a que todos respondan)
}

export enum PlayerStatus {
  WAITING = 'WAITING',
  READY = 'READY',
  PLAYING = 'PLAYING',
  DISCONNECTED = 'DISCONNECTED'
}

export interface Avatar {
  id: string;
  emoji: string;
  color: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: Avatar;
  status: PlayerStatus;
  score: number;
  streak: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number; // 0-100
  isHost: boolean;
  joinedAt: Date;
}

// Estado de juego individual por jugador
export interface PlayerGameState {
  playerId: string;
  currentQuestionIndex: number; // Índice de pregunta actual de este jugador
  status: 'QUESTION' | 'WAITING_RESULTS' | 'FINISHED'; // Estado individual del jugador
  questionStartTime?: number; // Timestamp de inicio de su pregunta actual
  hasAnsweredCurrent: boolean; // Si ya respondió la pregunta actual
  answers: PlayerAnswer[]; // Historial de respuestas de este jugador
  lastActivityAt: number; // Para detectar jugadores inactivos
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  timeLimit: number; // milliseconds
  imageUrl?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
}

export interface PlayerAnswer {
  playerId: string;
  questionId: string;
  optionId: string;
  answeredAt: number; // timestamp
  timeElapsed: number; // milliseconds desde que inició la pregunta
  isCorrect: boolean;
  pointsEarned: number;
}

export interface QuestionResults {
  questionId: string;
  totalPlayers: number;
  optionVotes: Record<string, number>; // optionId -> count
  correctOptionId: string;
  playerAnswers: PlayerAnswer[];
}

export interface Game {
  id: string;
  code: string; // 6-digit code
  quizId: string;
  quiz: Quiz;
  hostId: string;
  hostName: string;
  status: GameStatus; // Estado general del juego (LOBBY, PLAYING, FINISHED)
  mode: GameMode;
  players: Player[];
  playerStates: Record<string, PlayerGameState>; // Estados individuales por playerId
  currentQuestionIndex: number; // DEPRECATED: Solo para compatibilidad temporal
  questionStartTime?: number; // DEPRECATED: Solo para compatibilidad temporal
  results: QuestionResults[];
  createdAt: Date;
  finishedAt?: Date;
}

export interface RankingEntry {
  player: Player;
  rank: number;
  previousRank?: number;
}

// ============================================================================
// SOCKET EVENTS (GRASP: Low Coupling)
// ============================================================================

export namespace SocketEvents {
  // Host Events
  export const HOST_CREATE_GAME = 'host:create_game';
  export const HOST_START_GAME = 'host:start_game';
  export const HOST_NEXT_QUESTION = 'host:next_question';
  export const HOST_END_GAME = 'host:end_game';

  // Player Events
  export const PLAYER_JOIN_GAME = 'player:join_game';
  export const PLAYER_LEAVE_GAME = 'player:leave_game';
  export const PLAYER_SUBMIT_ANSWER = 'player:submit_answer';
  export const PLAYER_READY_NEXT = 'player:ready_next'; // Jugador listo para siguiente pregunta

  // Game Events (Server -> Clients) - LEGACY (se emiten a toda la sala)
  export const GAME_CREATED = 'game:created';
  export const GAME_UPDATED = 'game:updated';
  export const GAME_STARTED = 'game:started';
  export const GAME_QUESTION_START = 'game:question_start'; // DEPRECATED: usar PLAYER_QUESTION_START
  export const GAME_QUESTION_END = 'game:question_end'; // DEPRECATED: usar PLAYER_QUESTION_END
  export const GAME_SHOW_RESULTS = 'game:show_results'; // DEPRECATED: usar PLAYER_SHOW_RESULTS
  export const GAME_SHOW_RANKING = 'game:show_ranking'; // DEPRECATED: usar PLAYER_SHOW_RANKING
  export const GAME_STATS_UPDATE = 'game:stats_update';
  export const GAME_FINISHED = 'game:finished'; // DEPRECATED: usar PLAYER_GAME_FINISHED
  export const PLAYER_JOINED = 'player:joined';
  export const PLAYER_LEFT = 'player:left';
  export const ERROR = 'error';

  // Player-Specific Events (Server -> Individual Player)
  export const PLAYER_QUESTION_START = 'player:question_start'; // Pregunta individual
  export const PLAYER_QUESTION_END = 'player:question_end'; // Fin de pregunta individual
  export const PLAYER_SHOW_RESULTS = 'player:show_results'; // Resultados individuales
  export const PLAYER_SHOW_RANKING = 'player:show_ranking'; // Ranking individual
  export const PLAYER_GAME_FINISHED = 'player:game_finished'; // Fin de juego individual
  export const PLAYER_STATE_UPDATE = 'player:state_update'; // Actualización de estado individual
}

// ============================================================================
// SOCKET PAYLOADS (GRASP: Pure Fabrication para DTOs)
// ============================================================================

export interface CreateGamePayload {
  quizId: string;
  hostName: string;
  mode?: GameMode;
}

export interface CreateGameResponse {
  game: Game;
  qrCode: string; // Data URL del QR
  joinUrl: string;
}

export interface JoinGamePayload {
  code: string;
  playerName: string;
}

export interface JoinGameResponse {
  game: Game;
  player: Player;
}

export interface SubmitAnswerPayload {
  gameId: string;
  playerId: string;
  questionId: string;
  optionId: string;
  timeElapsed: number;
}

export interface QuestionStartPayload {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  startTime: number;
}

export interface QuestionEndPayload {
  questionId: string;
  correctOptionId: string;
}

export interface ShowResultsPayload {
  questionResults: QuestionResults;
  question: Question;
}

export interface ShowRankingPayload {
  ranking: RankingEntry[];
  topPlayers: RankingEntry[]; // Top 5
}

export interface GameFinishedPayload {
  finalRanking: RankingEntry[];
  podium: RankingEntry[]; // Top 3
  questionHistory: {
    question: Question;
    results: QuestionResults;
  }[];
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

export interface PlayerStats {
  player: Player;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswers: number;
  correctPercentage: number;
  incorrectPercentage: number;
  score: number;
  accuracy: number;
}

export interface GameStatsPayload {
  currentQuestionIndex: number;
  totalQuestions: number;
  playerStats: PlayerStats[];
}

// Payloads para eventos individuales de jugador
export interface PlayerStateUpdatePayload {
  playerState: PlayerGameState;
  player: Player; // Incluye info actualizada del jugador (score, etc.)
}

export interface PlayerQuestionStartPayload {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  startTime: number;
  playerState: PlayerGameState;
}

export interface PlayerQuestionEndPayload {
  questionId: string;
  correctOptionId: string;
  playerAnswer?: PlayerAnswer; // La respuesta de este jugador
}

export interface PlayerShowResultsPayload {
  questionResults: QuestionResults; // Resultados globales
  question: Question;
  playerAnswer?: PlayerAnswer; // Respuesta de este jugador
}

export interface PlayerShowRankingPayload {
  ranking: RankingEntry[];
  currentPlayerRank: number; // Posición de este jugador
  topPlayers: RankingEntry[];
}

export interface PlayerGameFinishedPayload {
  finalRanking: RankingEntry[];
  playerRank: number; // Posición final de este jugador
  playerScore: number;
  podium: RankingEntry[];
  questionHistory: {
    question: Question;
    results: QuestionResults;
  }[];
}

// ============================================================================
// SCORING CONSTANTS (Single Responsibility)
// ============================================================================

export const SCORING = {
  // Sistema de velocidad: puntos base que disminuyen linealmente con el tiempo
  BASE_POINTS: 1000,
  MIN_POINTS: 200, // Puntos mínimos garantizados por respuesta correcta

  // Sistema de rachas: multiplicador progresivo
  STREAK_MULTIPLIER: 0.10, // +10% por cada racha (racha 1 = x1.1, racha 2 = x1.2, etc.)
  MAX_STREAK_MULTIPLIER: 2.0, // Multiplicador máximo (racha 10 = x2.0)
} as const;

// ============================================================================
// AVATAR PRESETS (Open/Closed Principle - fácil de extender)
// ============================================================================

export const AVATAR_PRESETS: Avatar[] = [
  { id: 'av1', emoji: '😀', color: '#FF6B6B' },
  { id: 'av2', emoji: '😎', color: '#4ECDC4' },
  { id: 'av3', emoji: '🤓', color: '#45B7D1' },
  { id: 'av4', emoji: '😺', color: '#FFA07A' },
  { id: 'av5', emoji: '🦊', color: '#FF8C42' },
  { id: 'av6', emoji: '🐼', color: '#98D8C8' },
  { id: 'av7', emoji: '🦁', color: '#F7DC6F' },
  { id: 'av8', emoji: '🐸', color: '#7DCEA0' },
  { id: 'av9', emoji: '🦄', color: '#BB8FCE' },
  { id: 'av10', emoji: '🐙', color: '#85C1E2' },
  { id: 'av11', emoji: '🚀', color: '#5DADE2' },
  { id: 'av12', emoji: '⚡', color: '#F4D03F' },
  { id: 'av13', emoji: '🔥', color: '#E74C3C' },
  { id: 'av14', emoji: '⭐', color: '#F8B500' },
  { id: 'av15', emoji: '💎', color: '#3498DB' },
  { id: 'av16', emoji: '🎨', color: '#9B59B6' },
  { id: 'av17', emoji: '🎮', color: '#E67E22' },
  { id: 'av18', emoji: '🎸', color: '#E91E63' },
  { id: 'av19', emoji: '🌈', color: '#16A085' },
  { id: 'av20', emoji: '🍕', color: '#D35400' },
];
