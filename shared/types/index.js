"use strict";
// ============================================================================
// SHARED TYPES - QuizArena
// Tipos compartidos entre Frontend y Backend (GRASP: Information Expert)
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVATAR_PRESETS = exports.SCORING = exports.SocketEvents = exports.PlayerStatus = exports.GameStatus = void 0;
var GameStatus;
(function (GameStatus) {
    GameStatus["LOBBY"] = "LOBBY";
    GameStatus["PLAYING"] = "PLAYING";
    GameStatus["QUESTION"] = "QUESTION";
    GameStatus["RESULTS"] = "RESULTS";
    GameStatus["FINISHED"] = "FINISHED";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
var PlayerStatus;
(function (PlayerStatus) {
    PlayerStatus["WAITING"] = "WAITING";
    PlayerStatus["READY"] = "READY";
    PlayerStatus["PLAYING"] = "PLAYING";
    PlayerStatus["DISCONNECTED"] = "DISCONNECTED";
})(PlayerStatus || (exports.PlayerStatus = PlayerStatus = {}));
// ============================================================================
// SOCKET EVENTS (GRASP: Low Coupling)
// ============================================================================
var SocketEvents;
(function (SocketEvents) {
    // Host Events
    SocketEvents.HOST_CREATE_GAME = 'host:create_game';
    SocketEvents.HOST_START_GAME = 'host:start_game';
    SocketEvents.HOST_NEXT_QUESTION = 'host:next_question';
    SocketEvents.HOST_END_GAME = 'host:end_game';
    // Player Events
    SocketEvents.PLAYER_JOIN_GAME = 'player:join_game';
    SocketEvents.PLAYER_LEAVE_GAME = 'player:leave_game';
    SocketEvents.PLAYER_SUBMIT_ANSWER = 'player:submit_answer';
    // Game Events (Server -> Clients)
    SocketEvents.GAME_CREATED = 'game:created';
    SocketEvents.GAME_UPDATED = 'game:updated';
    SocketEvents.GAME_STARTED = 'game:started';
    SocketEvents.GAME_QUESTION_START = 'game:question_start';
    SocketEvents.GAME_QUESTION_END = 'game:question_end';
    SocketEvents.GAME_SHOW_RESULTS = 'game:show_results';
    SocketEvents.GAME_SHOW_RANKING = 'game:show_ranking';
    SocketEvents.GAME_FINISHED = 'game:finished';
    SocketEvents.PLAYER_JOINED = 'player:joined';
    SocketEvents.PLAYER_LEFT = 'player:left';
    SocketEvents.ERROR = 'error';
})(SocketEvents || (exports.SocketEvents = SocketEvents = {}));
// ============================================================================
// SCORING CONSTANTS (Single Responsibility)
// ============================================================================
exports.SCORING = {
    // Sistema de velocidad: puntos base que disminuyen linealmente con el tiempo
    BASE_POINTS: 1000,
    MIN_POINTS: 200, // Puntos mínimos garantizados por respuesta correcta
    // Sistema de rachas: multiplicador progresivo
    STREAK_MULTIPLIER: 0.10, // +10% por cada racha (racha 1 = x1.1, racha 2 = x1.2, etc.)
    MAX_STREAK_MULTIPLIER: 2.0, // Multiplicador máximo (racha 10 = x2.0)
};
// ============================================================================
// AVATAR PRESETS (Open/Closed Principle - fácil de extender)
// ============================================================================
exports.AVATAR_PRESETS = [
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
//# sourceMappingURL=index.js.map