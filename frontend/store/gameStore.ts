// ============================================================================
// GAME STORE (Zustand)
// GRASP: Information Expert - Gestiona el estado global del juego en el frontend
// ============================================================================

import { create } from 'zustand';
import {
  Game,
  Player,
  PlayerGameState,
  Question,
  QuestionResults,
  RankingEntry,
  GameStatus,
  GameStatsPayload,
} from '@/shared/types';

interface GameState {
  // Game data
  game: Game | null;
  currentPlayer: Player | null;
  playerState: PlayerGameState | null; // Estado individual del jugador actual
  currentQuestion: Question | null;
  questionStartTime: number | null;
  questionResults: QuestionResults | null;
  ranking: RankingEntry[] | null;
  currentPlayerRank: number | null; // Posición actual del jugador
  gameStats: GameStatsPayload | null;
  finalData: {
    finalRanking: RankingEntry[];
    podium: RankingEntry[];
    questionHistory: any[];
  } | null;

  // UI state
  isConnected: boolean;
  hasAnswered: boolean;
  selectedOptionId: string | null;
  transitionState: 'idle' | 'answering' | 'showing_feedback' | 'showing_ranking' | 'loading_next';

  // Feedback data
  answerFeedback: {
    isCorrect: boolean;
    pointsEarned: number;
    correctOptionId: string;
    selectedOptionId: string;
  } | null;

  // Actions
  setGame: (game: Game) => void;
  setCurrentPlayer: (player: Player) => void;
  setPlayerState: (playerState: PlayerGameState) => void; // Nueva acción
  setCurrentQuestion: (question: Question, startTime: number) => void;
  setQuestionResults: (results: QuestionResults) => void;
  setRanking: (ranking: RankingEntry[], currentPlayerRank?: number) => void;
  setGameStats: (stats: GameStatsPayload) => void;
  setFinalData: (data: any) => void;
  setIsConnected: (connected: boolean) => void;
  setHasAnswered: (answered: boolean) => void;
  setSelectedOptionId: (optionId: string | null) => void;
  setTransitionState: (state: 'idle' | 'answering' | 'showing_feedback' | 'showing_ranking' | 'loading_next') => void;
  setAnswerFeedback: (feedback: any) => void;
  updateGameStatus: (status: GameStatus) => void;
  updatePlayers: (players: Player[]) => void;
  reset: () => void;
}

const initialState = {
  game: null,
  currentPlayer: null,
  playerState: null,
  currentQuestion: null,
  questionStartTime: null,
  questionResults: null,
  ranking: null,
  currentPlayerRank: null,
  gameStats: null,
  finalData: null,
  isConnected: false,
  hasAnswered: false,
  selectedOptionId: null,
  transitionState: 'idle' as const,
  answerFeedback: null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setGame: (game) => set({ game }),

  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  setPlayerState: (playerState) => set({ playerState }),

  setCurrentQuestion: (question, startTime) =>
    set({
      currentQuestion: question,
      questionStartTime: startTime,
      hasAnswered: false,
      selectedOptionId: null,
      transitionState: 'idle',
      answerFeedback: null,
    }),

  setQuestionResults: (results) => set({ questionResults: results }),

  setRanking: (ranking, currentPlayerRank) => set({ ranking, currentPlayerRank }),

  setTransitionState: (state) => set({ transitionState: state }),

  setAnswerFeedback: (feedback) => set({ answerFeedback: feedback, transitionState: 'showing_feedback' }),

  setGameStats: (stats) => set({ gameStats: stats }),

  setFinalData: (data) => set({ finalData: data }),

  setIsConnected: (connected) => set({ isConnected: connected }),

  setHasAnswered: (answered) => set({ hasAnswered: answered }),

  setSelectedOptionId: (optionId) => set({ selectedOptionId: optionId }),

  updateGameStatus: (status) =>
    set((state) => {
      if (!state.game) return state;
      return {
        game: {
          ...state.game,
          status,
        },
      };
    }),

  updatePlayers: (players) =>
    set((state) => {
      if (!state.game) return state;
      return {
        game: {
          ...state.game,
          players,
        },
      };
    }),

  reset: () => set(initialState),
}));
