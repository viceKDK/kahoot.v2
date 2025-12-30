// ============================================================================
// QUIZARENA SERVER
// Main entry point - Express + Socket.IO Server
// ============================================================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import database from './config/database';
import { GameSocketHandler } from './sockets/gameSocket';
import quizRoutes from './controllers/quizController';
import playerRoutes from './controllers/playerController';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// SECURITY: Rate Limiter (Anti-DDoS / Anti-Bruteforce)
// Limita a 200 peticiones cada 15 minutos por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, 
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

// SECURITY: Helmet (Secure HTTP Headers)
app.use(helmet());
app.use(limiter);

// Configuración de IPs permitidas (CORS)
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.1.52:3000', // Tu IP local actual
  process.env.FRONTEND_URL || '' // Para cuando despliegues a producción
];

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Permitir requests sin origin (como Postman o móviles apps nativas) o si está en la lista blanca
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://192.168.')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://192.168.')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' })); // Limit body size to prevents DoS
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/quizzes', quizRoutes);
app.use('/api/players', playerRoutes);

// Socket.IO event handlers
const gameSocketHandler = new GameSocketHandler(io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  gameSocketHandler.setupHandlers(socket);
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces de red
// Usar la IP del entorno o fallback a localhost
const SERVER_IP = process.env.SERVER_IP || 'localhost';

httpServer.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════╗
║                                        ║
║       🎮 QuizArena Server 🎮          ║
║                                        ║
║  Server: http://${SERVER_IP}:${PORT}          ║
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
