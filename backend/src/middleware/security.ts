import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

/**
 * Configuración de Helmet para headers de seguridad (WAF básico)
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.CORS_ORIGIN || 'http://localhost:3000'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // Previene clickjacking
  frameguard: {
    action: 'deny'
  },

  // Fuerza HTTPS en producción
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },

  // Previene MIME sniffing
  noSniff: true,

  // Desactiva el cache de DNS prefetching
  dnsPrefetchControl: {
    allow: false
  },

  // Desactiva IE download option
  ieNoOpen: true,

  // Oculta el header X-Powered-By
  hidePoweredBy: true,

  // Referrer policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // XSS Protection (legacy pero aún útil)
  xssFilter: true,
});

/**
 * Sanitización de datos NoSQL injection
 * Remueve $ y . de user input
 */
export const sanitizeData = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key }) => {
    console.warn(`⚠️ Sanitizado intento de NoSQL injection en key: ${key}`);
  }
});

/**
 * Protección contra HTTP Parameter Pollution
 */
export const parameterPollutionProtection = hpp({
  whitelist: [] // Permitir parámetros duplicados específicos si es necesario
});

/**
 * Middleware para validar límites de tamaño de datos
 */
export function dataSizeLimiter(req: Request, res: Response, next: NextFunction): void {
  const MAX_TITLE_LENGTH = 200;
  const MAX_TEXT_LENGTH = 1000;
  const MAX_QUESTIONS = 50;
  const MAX_OPTIONS = 6;

  // Validar body si existe
  if (req.body) {
    // Quiz validations
    if (req.body.title && req.body.title.length > MAX_TITLE_LENGTH) {
      res.status(400).json({
        error: `El título no puede exceder ${MAX_TITLE_LENGTH} caracteres`,
        code: 'TITLE_TOO_LONG'
      });
      return;
    }

    if (req.body.description && req.body.description.length > MAX_TEXT_LENGTH) {
      res.status(400).json({
        error: `La descripción no puede exceder ${MAX_TEXT_LENGTH} caracteres`,
        code: 'DESCRIPTION_TOO_LONG'
      });
      return;
    }

    if (req.body.questions && Array.isArray(req.body.questions)) {
      if (req.body.questions.length > MAX_QUESTIONS) {
        res.status(400).json({
          error: `No se pueden crear más de ${MAX_QUESTIONS} preguntas`,
          code: 'TOO_MANY_QUESTIONS'
        });
        return;
      }

      // Validar cada pregunta
      for (const question of req.body.questions) {
        if (question.text && question.text.length > MAX_TEXT_LENGTH) {
          res.status(400).json({
            error: `El texto de la pregunta no puede exceder ${MAX_TEXT_LENGTH} caracteres`,
            code: 'QUESTION_TEXT_TOO_LONG'
          });
          return;
        }

        if (question.options && Array.isArray(question.options)) {
          if (question.options.length > MAX_OPTIONS) {
            res.status(400).json({
              error: `No se pueden tener más de ${MAX_OPTIONS} opciones por pregunta`,
              code: 'TOO_MANY_OPTIONS'
            });
            return;
          }

          for (const option of question.options) {
            if (option.text && option.text.length > MAX_TEXT_LENGTH) {
              res.status(400).json({
                error: `El texto de la opción no puede exceder ${MAX_TEXT_LENGTH} caracteres`,
                code: 'OPTION_TEXT_TOO_LONG'
              });
              return;
            }
          }
        }
      }
    }

    // Player name validation
    if (req.body.playerName && req.body.playerName.length > 50) {
      res.status(400).json({
        error: 'El nombre del jugador no puede exceder 50 caracteres',
        code: 'PLAYER_NAME_TOO_LONG'
      });
      return;
    }
  }

  next();
}

/**
 * Middleware para sanitizar strings (prevenir XSS)
 */
export function sanitizeStrings(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
}

/**
 * Sanitiza un objeto recursivamente
 */
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remover tags HTML y scripts
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Middleware para logging de solicitudes sospechosas
 */
export function suspiciousActivityLogger(req: Request, _res: Response, next: NextFunction): void {
  const suspiciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL injection
    /<script.*?>/i, // XSS
    /javascript:/i, // XSS
    /on\w+\s*=/i, // Event handlers
    /\$where/i, // NoSQL injection
    /\{\s*\$.*\}/i, // NoSQL injection
  ];

  const checkValue = (value: string): boolean => {
    return suspiciousPatterns.some(pattern => pattern.test(value));
  };

  let suspicious = false;
  const suspiciousData: any = {};

  // Verificar body
  if (req.body) {
    for (const key in req.body) {
      const value = JSON.stringify(req.body[key]);
      if (checkValue(value)) {
        suspicious = true;
        suspiciousData.body = suspiciousData.body || {};
        suspiciousData.body[key] = value;
      }
    }
  }

  // Verificar query params
  if (req.query) {
    for (const key in req.query) {
      const value = String(req.query[key]);
      if (checkValue(value)) {
        suspicious = true;
        suspiciousData.query = suspiciousData.query || {};
        suspiciousData.query[key] = value;
      }
    }
  }

  if (suspicious) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.warn(`⚠️ Actividad sospechosa detectada:`, {
      ip,
      method: req.method,
      path: req.path,
      data: suspiciousData,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Middleware para prevenir ataques de timing
 */
export function constantTimeResponse(_req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Override res.json to add delay if needed
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const elapsed = Date.now() - startTime;
    const minResponseTime = 100; // 100ms mínimo

    if (elapsed < minResponseTime) {
      setTimeout(() => {
        originalJson(body);
      }, minResponseTime - elapsed);
    } else {
      originalJson(body);
    }

    return res;
  };

  next();
}
