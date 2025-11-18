// ============================================================================
// QUIZARENA SERVER
// Main entry point - Express + Socket.IO Server
// ============================================================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import database from './config/database';
import { GameSocketHandler } from './sockets/gameSocket';
import quizRoutes from './controllers/quizController';

// Security middleware imports
import { generalLimiter } from './middleware/rateLimiter';
import { blacklistMiddleware } from './middleware/blacklist';
import {
  helmetConfig,
  sanitizeData,
  parameterPollutionProtection,
  dataSizeLimiter,
  sanitizeStrings,
  suspiciousActivityLogger,
} from './middleware/security';
import { socketAuthMiddleware, trackConnection } from './middleware/socketProtection';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO configuration with security
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  // Limitar tamaño de mensajes
  maxHttpBufferSize: 1e6, // 1MB
  // Timeout de ping/pong
  pingTimeout: 20000,
  pingInterval: 25000,
});

// ============================================================================
// SECURITY MIDDLEWARE - Orden importa!
// ============================================================================

// 1. Helmet - Headers de seguridad (WAF básico)
app.use(helmetConfig);

// 2. Blacklist - Bloquear IPs maliciosas PRIMERO
app.use(blacklistMiddleware);

// 3. Rate limiting general
if (process.env.ENABLE_RATE_LIMITING !== 'false') {
  app.use(generalLimiter);
}

// 4. CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// 5. Body parsers con límites
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Sanitización de datos (NoSQL injection, XSS)
app.use(sanitizeData);
app.use(sanitizeStrings);

// 7. Protección contra HTTP Parameter Pollution
app.use(parameterPollutionProtection);

// 8. Validación de límites de datos
app.use(dataSizeLimiter);

// 9. Logging de actividad sospechosa
if (process.env.LOG_SUSPICIOUS_ACTIVITY !== 'false') {
  app.use(suspiciousActivityLogger);
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/quizzes', quizRoutes);

// ============================================================================
// SOCKET.IO SECURITY & EVENT HANDLERS
// ============================================================================

// Socket.IO middleware de autenticación
io.use(socketAuthMiddleware);

// Socket.IO event handlers
const gameSocketHandler = new GameSocketHandler(io);

io.on('connection', (socket) => {
  const clientIP = (socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                   socket.handshake.address;

  console.log(`🔌 Client connected: ${socket.id} from IP: ${clientIP}`);

  // Rastrear conexión y obtener función de cleanup
  const cleanup = trackConnection(socket);

  // Configurar handlers del juego
  gameSocketHandler.setupHandlers(socket);

  // Cleanup al desconectar
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
    cleanup();
  });
});

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║                                        ║
║       🎮 QuizArena Server 🎮          ║
║                                        ║
║  Server running on port ${PORT}        ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║                                        ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(async () => {
    await database.close();
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(async () => {
    await database.close();
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
