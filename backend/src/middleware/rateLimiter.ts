import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter general para todas las rutas
 * Límite: 100 requests por 15 minutos por IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests por ventana
  standardHeaders: true, // Retorna info en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  message: {
    error: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
      retryAfter: '15 minutos'
    });
  },
  // Usar IP real detrás de proxies
  keyGenerator: (req: Request) => {
    return req.ip ||
           req.headers['x-forwarded-for']?.toString().split(',')[0] ||
           req.socket.remoteAddress ||
           'unknown';
  }
});

/**
 * Rate limiter estricto para creación de quizzes
 * Límite: 10 quizzes por hora por IP
 */
export const quizCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Has alcanzado el límite de creación de quizzes. Intenta de nuevo en 1 hora.',
    retryAfter: '1 hora'
  },
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => {
    return req.ip ||
           req.headers['x-forwarded-for']?.toString().split(',')[0] ||
           req.socket.remoteAddress ||
           'unknown';
  }
});

/**
 * Rate limiter para autenticación y acciones sensibles
 * Límite: 5 intentos por 5 minutos por IP
 */
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos fallidos. Por favor intenta de nuevo en 5 minutos.',
    retryAfter: '5 minutos'
  },
  skipSuccessfulRequests: true, // Solo cuenta intentos fallidos
  keyGenerator: (req: Request) => {
    return req.ip ||
           req.headers['x-forwarded-for']?.toString().split(',')[0] ||
           req.socket.remoteAddress ||
           'unknown';
  }
});

/**
 * Rate limiter para endpoints de listado
 * Límite: 30 requests por minuto por IP
 */
export const listLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes de listado. Por favor espera un momento.',
    retryAfter: '1 minuto'
  },
  keyGenerator: (req: Request) => {
    return req.ip ||
           req.headers['x-forwarded-for']?.toString().split(',')[0] ||
           req.socket.remoteAddress ||
           'unknown';
  }
});
