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

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    // En desarrollo, permitimos cualquier origen (PC, móvil, etc.)
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(
  cors({
    // Igual que arriba: aceptar cualquier origen en dev
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/quizzes', quizRoutes);

// Socket.IO event handlers
const gameSocketHandler = new GameSocketHandler(io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  gameSocketHandler.setupHandlers(socket);
});

// Start server
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces de red

httpServer.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════╗
║                                        ║
║       🎮 QuizArena Server 🎮          ║
║                                        ║
║  Server: http://192.168.1.6:${PORT}     ║
║  Local:  http://localhost:${PORT}       ║
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
