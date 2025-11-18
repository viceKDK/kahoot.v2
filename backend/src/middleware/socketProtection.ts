import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';

/**
 * Sistema de rate limiting para Socket.IO
 */
class SocketRateLimiter {
  private static instance: SocketRateLimiter;
  private eventCounts: Map<string, Map<string, number[]>>;
  private connectionCounts: Map<string, number[]>;

  // Configuración
  private readonly MAX_EVENTS_PER_SECOND = 10;
  private readonly MAX_EVENTS_PER_MINUTE = 100;
  private readonly MAX_CONNECTIONS_PER_IP_PER_MINUTE = 20;
  private readonly CLEANUP_INTERVAL = 60000; // 1 minuto

  private constructor() {
    this.eventCounts = new Map();
    this.connectionCounts = new Map();

    // Limpieza periódica de contadores antiguos
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  public static getInstance(): SocketRateLimiter {
    if (!SocketRateLimiter.instance) {
      SocketRateLimiter.instance = new SocketRateLimiter();
    }
    return SocketRateLimiter.instance;
  }

  /**
   * Verifica y registra un evento de socket
   */
  public checkEventRateLimit(socketId: string, eventName: string): boolean {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;

    // Obtener o crear registro de eventos para este socket
    if (!this.eventCounts.has(socketId)) {
      this.eventCounts.set(socketId, new Map());
    }

    const socketEvents = this.eventCounts.get(socketId)!;

    if (!socketEvents.has(eventName)) {
      socketEvents.set(eventName, []);
    }

    const events = socketEvents.get(eventName)!;

    // Filtrar eventos antiguos
    const recentEvents = events.filter(timestamp => timestamp > oneMinuteAgo);

    // Verificar límite por segundo
    const eventsLastSecond = recentEvents.filter(timestamp => timestamp > oneSecondAgo).length;
    if (eventsLastSecond >= this.MAX_EVENTS_PER_SECOND) {
      console.warn(`⚠️ Rate limit excedido (por segundo) - Socket: ${socketId}, Evento: ${eventName}`);
      return false;
    }

    // Verificar límite por minuto
    if (recentEvents.length >= this.MAX_EVENTS_PER_MINUTE) {
      console.warn(`⚠️ Rate limit excedido (por minuto) - Socket: ${socketId}, Evento: ${eventName}`);
      return false;
    }

    // Registrar el nuevo evento
    recentEvents.push(now);
    socketEvents.set(eventName, recentEvents);

    return true;
  }

  /**
   * Verifica y registra una nueva conexión
   */
  public checkConnectionRateLimit(ip: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    if (!this.connectionCounts.has(ip)) {
      this.connectionCounts.set(ip, []);
    }

    const connections = this.connectionCounts.get(ip)!;

    // Filtrar conexiones antiguas
    const recentConnections = connections.filter(timestamp => timestamp > oneMinuteAgo);

    // Verificar límite
    if (recentConnections.length >= this.MAX_CONNECTIONS_PER_IP_PER_MINUTE) {
      console.warn(`⚠️ Rate limit de conexiones excedido - IP: ${ip}`);
      return false;
    }

    // Registrar la nueva conexión
    recentConnections.push(now);
    this.connectionCounts.set(ip, recentConnections);

    return true;
  }

  /**
   * Limpia el registro cuando un socket se desconecta
   */
  public cleanupSocket(socketId: string): void {
    this.eventCounts.delete(socketId);
  }

  /**
   * Limpia contadores antiguos
   */
  private cleanup(): void {
    const oneMinuteAgo = Date.now() - 60000;

    // Limpiar event counts
    for (const [socketId, events] of this.eventCounts.entries()) {
      for (const [eventName, timestamps] of events.entries()) {
        const recent = timestamps.filter(t => t > oneMinuteAgo);
        if (recent.length === 0) {
          events.delete(eventName);
        } else {
          events.set(eventName, recent);
        }
      }

      if (events.size === 0) {
        this.eventCounts.delete(socketId);
      }
    }

    // Limpiar connection counts
    for (const [ip, timestamps] of this.connectionCounts.entries()) {
      const recent = timestamps.filter(t => t > oneMinuteAgo);
      if (recent.length === 0) {
        this.connectionCounts.delete(ip);
      } else {
        this.connectionCounts.set(ip, recent);
      }
    }
  }

  /**
   * Obtiene estadísticas
   */
  public getStats(): {
    activeSocketsTracked: number;
    activeIPsTracked: number;
  } {
    return {
      activeSocketsTracked: this.eventCounts.size,
      activeIPsTracked: this.connectionCounts.size
    };
  }
}

/**
 * Middleware de autenticación para Socket.IO
 */
export function socketAuthMiddleware(socket: Socket, next: (err?: ExtendedError) => void): void {
  const limiter = SocketRateLimiter.getInstance();

  // Obtener IP real
  const ip = (socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0] ||
              socket.handshake.address;

  // Verificar rate limit de conexiones
  if (!limiter.checkConnectionRateLimit(ip)) {
    const error = new Error('Demasiadas conexiones desde esta IP') as ExtendedError;
    error.data = { code: 'RATE_LIMIT_EXCEEDED' };
    return next(error);
  }

  // Aquí se pueden agregar más validaciones:
  // - Validar tokens de autenticación
  // - Verificar blacklist
  // - Validar origen
  // etc.

  next();
}

/**
 * Crea un wrapper para eventos de socket con rate limiting
 */
export function createRateLimitedEventHandler<T = any>(
  eventName: string,
  handler: (socket: Socket, data: T) => void | Promise<void>
): (socket: Socket, data: T) => void {
  const limiter = SocketRateLimiter.getInstance();

  return function (socket: Socket, data: T): void {
    // Verificar rate limit
    if (!limiter.checkEventRateLimit(socket.id, eventName)) {
      socket.emit('error', {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiados eventos enviados. Por favor espera un momento.',
        event: eventName
      });
      return;
    }

    // Ejecutar el handler original
    handler(socket, data);
  };
}

/**
 * Configuración de límites de conexión para Socket.IO
 */
export const socketConnectionLimits = {
  // Máximo de conexiones simultáneas por IP
  maxConnectionsPerIP: parseInt(process.env.MAX_SOCKET_CONNECTIONS_PER_IP || '10'),

  // Timeout de inactividad (ms)
  inactivityTimeout: parseInt(process.env.SOCKET_INACTIVITY_TIMEOUT || '300000'), // 5 minutos

  // Máximo de jugadores por juego
  maxPlayersPerGame: parseInt(process.env.MAX_PLAYERS_PER_GAME || '100'),
};

/**
 * Rastrea conexiones por IP
 */
class ConnectionTracker {
  private static instance: ConnectionTracker;
  private connections: Map<string, Set<string>>; // IP -> Set of socket IDs

  private constructor() {
    this.connections = new Map();
  }

  public static getInstance(): ConnectionTracker {
    if (!ConnectionTracker.instance) {
      ConnectionTracker.instance = new ConnectionTracker();
    }
    return ConnectionTracker.instance;
  }

  public addConnection(ip: string, socketId: string): boolean {
    if (!this.connections.has(ip)) {
      this.connections.set(ip, new Set());
    }

    const sockets = this.connections.get(ip)!;

    // Verificar límite
    if (sockets.size >= socketConnectionLimits.maxConnectionsPerIP) {
      console.warn(`⚠️ Límite de conexiones alcanzado para IP: ${ip}`);
      return false;
    }

    sockets.add(socketId);
    return true;
  }

  public removeConnection(ip: string, socketId: string): void {
    const sockets = this.connections.get(ip);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.connections.delete(ip);
      }
    }
  }

  public getConnectionCount(ip: string): number {
    return this.connections.get(ip)?.size || 0;
  }

  public getStats(): {
    totalUniqueIPs: number;
    totalConnections: number;
  } {
    let totalConnections = 0;
    for (const sockets of this.connections.values()) {
      totalConnections += sockets.size;
    }

    return {
      totalUniqueIPs: this.connections.size,
      totalConnections
    };
  }
}

/**
 * Middleware para rastrear conexiones
 */
export function trackConnection(socket: Socket): () => void {
  const tracker = ConnectionTracker.getInstance();
  const ip = (socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0] ||
              socket.handshake.address;

  // Agregar conexión
  if (!tracker.addConnection(ip, socket.id)) {
    socket.emit('error', {
      code: 'CONNECTION_LIMIT_EXCEEDED',
      message: 'Has alcanzado el límite de conexiones simultáneas'
    });
    socket.disconnect(true);
  }

  // Retornar función de cleanup
  return () => {
    tracker.removeConnection(ip, socket.id);
    SocketRateLimiter.getInstance().cleanupSocket(socket.id);
  };
}

/**
 * Exportar instancias para uso en otros módulos
 */
export const socketRateLimiter = SocketRateLimiter.getInstance();
export const connectionTracker = ConnectionTracker.getInstance();
