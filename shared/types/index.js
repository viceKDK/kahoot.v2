"use strict";
// ============================================================================
// SHARED TYPES - QuizArena
// Tipos compartidos entre Frontend y Backend (GRASP: Information Expert)
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVATAR_PRESETS = exports.SCORING = exports.SocketEvents = exports.PlayerStatus = exports.GameMode = exports.GameStatus = void 0;
var GameStatus;
(function (GameStatus) {
    GameStatus["LOBBY"] = "LOBBY";
    GameStatus["PLAYING"] = "PLAYING";
    GameStatus["QUESTION"] = "QUESTION";
    GameStatus["RESULTS"] = "RESULTS";
    GameStatus["FINISHED"] = "FINISHED";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
var GameMode;
(function (GameMode) {
    GameMode["FAST"] = "FAST";
    GameMode["WAIT_ALL"] = "WAIT_ALL"; // Todos los jugadores avanzan juntos (esperan a que todos respondan)
})(GameMode || (exports.GameMode = GameMode = {}));
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
    SocketEvents.PLAYER_READY_NEXT = 'player:ready_next'; // Jugador listo para siguiente pregunta
    // Game Events (Server -> Clients) - LEGACY (se emiten a toda la sala)
    SocketEvents.GAME_CREATED = 'game:created';
    SocketEvents.GAME_UPDATED = 'game:updated';
    SocketEvents.GAME_STARTED = 'game:started';
    SocketEvents.GAME_QUESTION_START = 'game:question_start'; // DEPRECATED: usar PLAYER_QUESTION_START
    SocketEvents.GAME_QUESTION_END = 'game:question_end'; // DEPRECATED: usar PLAYER_QUESTION_END
    SocketEvents.GAME_SHOW_RESULTS = 'game:show_results'; // DEPRECATED: usar PLAYER_SHOW_RESULTS
    SocketEvents.GAME_SHOW_RANKING = 'game:show_ranking'; // DEPRECATED: usar PLAYER_SHOW_RANKING
    SocketEvents.GAME_STATS_UPDATE = 'game:stats_update';
    SocketEvents.GAME_FINISHED = 'game:finished'; // DEPRECATED: usar PLAYER_GAME_FINISHED
    SocketEvents.PLAYER_JOINED = 'player:joined';
    SocketEvents.PLAYER_LEFT = 'player:left';
    SocketEvents.ERROR = 'error';
    // Player-Specific Events (Server -> Individual Player)
    SocketEvents.PLAYER_QUESTION_START = 'player:question_start'; // Pregunta individual
    SocketEvents.PLAYER_QUESTION_END = 'player:question_end'; // Fin de pregunta individual
    SocketEvents.PLAYER_SHOW_RESULTS = 'player:show_results'; // Resultados individuales
    SocketEvents.PLAYER_SHOW_RANKING = 'player:show_ranking'; // Ranking individual
    SocketEvents.PLAYER_GAME_FINISHED = 'player:game_finished'; // Fin de juego individual
    SocketEvents.PLAYER_STATE_UPDATE = 'player:state_update'; // Actualización de estado individual
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