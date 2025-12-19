export declare enum GameStatus {
    LOBBY = "LOBBY",
    PLAYING = "PLAYING",
    QUESTION = "QUESTION",
    RESULTS = "RESULTS",
    FINISHED = "FINISHED"
}
export declare enum GameMode {
    FAST = "FAST",// Cada jugador avanza a su propio ritmo
    WAIT_ALL = "WAIT_ALL"
}
export declare enum PlayerStatus {
    WAITING = "WAITING",
    READY = "READY",
    PLAYING = "PLAYING",
    DISCONNECTED = "DISCONNECTED"
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
    accuracy: number;
    isHost: boolean;
    joinedAt: Date;
}
export interface PlayerGameState {
    playerId: string;
    currentQuestionIndex: number;
    status: 'QUESTION' | 'WAITING_RESULTS' | 'FINISHED';
    questionStartTime?: number;
    hasAnsweredCurrent: boolean;
    answers: PlayerAnswer[];
    lastActivityAt: number;
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
    timeLimit: number;
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
    answeredAt: number;
    timeElapsed: number;
    isCorrect: boolean;
    pointsEarned: number;
}
export interface QuestionResults {
    questionId: string;
    totalPlayers: number;
    optionVotes: Record<string, number>;
    correctOptionId: string;
    playerAnswers: PlayerAnswer[];
}
export interface Game {
    id: string;
    code: string;
    quizId: string;
    quiz: Quiz;
    hostId: string;
    hostName: string;
    status: GameStatus;
    mode: GameMode;
    players: Player[];
    playerStates: Record<string, PlayerGameState>;
    currentQuestionIndex: number;
    questionStartTime?: number;
    results: QuestionResults[];
    createdAt: Date;
    finishedAt?: Date;
}
export interface RankingEntry {
    player: Player;
    rank: number;
    previousRank?: number;
}
export declare namespace SocketEvents {
    const HOST_CREATE_GAME = "host:create_game";
    const HOST_START_GAME = "host:start_game";
    const HOST_NEXT_QUESTION = "host:next_question";
    const HOST_END_GAME = "host:end_game";
    const PLAYER_JOIN_GAME = "player:join_game";
    const PLAYER_LEAVE_GAME = "player:leave_game";
    const PLAYER_SUBMIT_ANSWER = "player:submit_answer";
    const PLAYER_READY_NEXT = "player:ready_next";
    const GAME_CREATED = "game:created";
    const GAME_UPDATED = "game:updated";
    const GAME_STARTED = "game:started";
    const GAME_QUESTION_START = "game:question_start";
    const GAME_QUESTION_END = "game:question_end";
    const GAME_SHOW_RESULTS = "game:show_results";
    const GAME_SHOW_RANKING = "game:show_ranking";
    const GAME_STATS_UPDATE = "game:stats_update";
    const GAME_FINISHED = "game:finished";
    const PLAYER_JOINED = "player:joined";
    const PLAYER_LEFT = "player:left";
    const ERROR = "error";
    const PLAYER_QUESTION_START = "player:question_start";
    const PLAYER_QUESTION_END = "player:question_end";
    const PLAYER_SHOW_RESULTS = "player:show_results";
    const PLAYER_SHOW_RANKING = "player:show_ranking";
    const PLAYER_GAME_FINISHED = "player:game_finished";
    const PLAYER_STATE_UPDATE = "player:state_update";
}
export interface CreateGamePayload {
    quizId: string;
    hostName: string;
    mode?: GameMode;
}
export interface CreateGameResponse {
    game: Game;
    qrCode: string;
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
    topPlayers: RankingEntry[];
}
export interface GameFinishedPayload {
    finalRanking: RankingEntry[];
    podium: RankingEntry[];
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
export interface PlayerStateUpdatePayload {
    playerState: PlayerGameState;
    player: Player;
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
    playerAnswer?: PlayerAnswer;
}
export interface PlayerShowResultsPayload {
    questionResults: QuestionResults;
    question: Question;
    playerAnswer?: PlayerAnswer;
}
export interface PlayerShowRankingPayload {
    ranking: RankingEntry[];
    currentPlayerRank: number;
    topPlayers: RankingEntry[];
}
export interface PlayerGameFinishedPayload {
    finalRanking: RankingEntry[];
    playerRank: number;
    playerScore: number;
    podium: RankingEntry[];
    questionHistory: {
        question: Question;
        results: QuestionResults;
    }[];
}
export declare const SCORING: {
    readonly BASE_POINTS: 1000;
    readonly MIN_POINTS: 200;
    readonly STREAK_MULTIPLIER: 0.1;
    readonly MAX_STREAK_MULTIPLIER: 2;
};
export declare const AVATAR_PRESETS: Avatar[];
//# sourceMappingURL=index.d.ts.map