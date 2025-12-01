// ============================================================================
// GAME STORE (Zustand)
// GRASP: Information Expert - Gestiona el estado global del juego en el frontend
// ============================================================================

import { create } from 'zustand';
import {
  Game,
  Player,
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
  currentQuestion: Question | null;
  questionStartTime: number | null;
  questionResults: QuestionResults | null;
  ranking: RankingEntry[] | null;
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

  // Actions
  setGame: (game: Game) => void;
  setCurrentPlayer: (player: Player) => void;
  setCurrentQuestion: (question: Question, startTime: number) => void;
  setQuestionResults: (results: QuestionResults) => void;
  setRanking: (ranking: RankingEntry[]) => void;
  setGameStats: (stats: GameStatsPayload) => void;
  setFinalData: (data: any) => void;
  setIsConnected: (connected: boolean) => void;
  setHasAnswered: (answered: boolean) => void;
  setSelectedOptionId: (optionId: string | null) => void;
  updateGameStatus: (status: GameStatus) => void;
  updatePlayers: (players: Player[]) => void;
  reset: () => void;
}

const initialState = {
  game: null,
  currentPlayer: null,
  currentQuestion: null,
  questionStartTime: null,
  questionResults: null,
  ranking: null,
  gameStats: null,
  finalData: null,
  isConnected: false,
  hasAnswered: false,
  selectedOptionId: null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setGame: (game) => set({ game }),

  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  setCurrentQuestion: (question, startTime) =>
    set({
      currentQuestion: question,
      questionStartTime: startTime,
      hasAnswered: false,
      selectedOptionId: null,
    }),

  setQuestionResults: (results) => set({ questionResults: results }),

  setRanking: (ranking) => set({ ranking }),

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
