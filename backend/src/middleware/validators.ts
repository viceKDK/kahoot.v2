import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para manejar errores de validación
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validación fallida',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    });
    return;
  }

  next();
}

/**
 * Validadores para creación de Quiz
 */
export const validateQuizCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('El título es requerido')
    .isLength({ min: 3, max: 200 }).withMessage('El título debe tener entre 3 y 200 caracteres')
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,!?()]+$/).withMessage('El título contiene caracteres no permitidos'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),

  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic debe ser un valor booleano'),

  body('creatorId')
    .trim()
    .notEmpty().withMessage('El ID del creador es requerido')
    .isUUID().withMessage('El ID del creador debe ser un UUID válido'),

  body('questions')
    .isArray({ min: 1, max: 50 }).withMessage('Debe haber entre 1 y 50 preguntas')
    .custom((questions) => {
      if (!Array.isArray(questions)) return false;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        // Validar text
        if (!q.text || typeof q.text !== 'string') {
          throw new Error(`Pregunta ${i + 1}: El texto es requerido`);
        }
        if (q.text.length > 1000) {
          throw new Error(`Pregunta ${i + 1}: El texto no puede exceder 1000 caracteres`);
        }

        // Validar options
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Pregunta ${i + 1}: Debe tener exactamente 4 opciones`);
        }

        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          if (!opt.text || typeof opt.text !== 'string') {
            throw new Error(`Pregunta ${i + 1}, Opción ${j + 1}: El texto es requerido`);
          }
          if (opt.text.length > 500) {
            throw new Error(`Pregunta ${i + 1}, Opción ${j + 1}: El texto no puede exceder 500 caracteres`);
          }
          if (typeof opt.isCorrect !== 'boolean') {
            throw new Error(`Pregunta ${i + 1}, Opción ${j + 1}: isCorrect debe ser booleano`);
          }
        }

        // Validar que haya exactamente una respuesta correcta
        const correctCount = q.options.filter((opt: any) => opt.isCorrect).length;
        if (correctCount !== 1) {
          throw new Error(`Pregunta ${i + 1}: Debe tener exactamente 1 respuesta correcta (tiene ${correctCount})`);
        }

        // Validar timeLimit
        if (q.timeLimit !== undefined) {
          if (typeof q.timeLimit !== 'number' || q.timeLimit < 5000 || q.timeLimit > 120000) {
            throw new Error(`Pregunta ${i + 1}: timeLimit debe estar entre 5000 y 120000 ms`);
          }
        }

        // Validar points
        if (q.points !== undefined) {
          if (typeof q.points !== 'number' || q.points < 100 || q.points > 10000) {
            throw new Error(`Pregunta ${i + 1}: points debe estar entre 100 y 10000`);
          }
        }
      }

      return true;
    }),

  handleValidationErrors
];

/**
 * Validadores para obtener quiz por ID
 */
export const validateGetQuiz = [
  param('id')
    .isUUID().withMessage('El ID debe ser un UUID válido'),

  handleValidationErrors
];

/**
 * Validadores para obtener quizzes por creador
 */
export const validateGetQuizzesByCreator = [
  param('creatorId')
    .isUUID().withMessage('El ID del creador debe ser un UUID válido'),

  handleValidationErrors
];

/**
 * Validadores para eliminar quiz
 */
export const validateDeleteQuiz = [
  param('id')
    .isUUID().withMessage('El ID debe ser un UUID válido'),

  handleValidationErrors
];

/**
 * Validadores para Socket.IO events (usados manualmente en gameSocket.ts)
 */
export const socketValidators = {
  /**
   * Valida código de juego
   */
  validateGameCode: (code: string): { valid: boolean; error?: string } => {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'El código es requerido' };
    }

    if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code)) {
      return { valid: false, error: 'Código de juego inválido' };
    }

    return { valid: true };
  },

  /**
   * Valida nombre de jugador
   */
  validatePlayerName: (name: string): { valid: boolean; error?: string } => {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'El nombre es requerido' };
    }

    const trimmed = name.trim();

    if (trimmed.length < 2 || trimmed.length > 50) {
      return { valid: false, error: 'El nombre debe tener entre 2 y 50 caracteres' };
    }

    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/.test(trimmed)) {
      return { valid: false, error: 'El nombre contiene caracteres no permitidos' };
    }

    return { valid: true };
  },

  /**
   * Valida ID de quiz
   */
  validateQuizId: (quizId: string): { valid: boolean; error?: string } => {
    if (!quizId || typeof quizId !== 'string') {
      return { valid: false, error: 'El ID del quiz es requerido' };
    }

    // UUID v4 format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(quizId)) {
      return { valid: false, error: 'ID de quiz inválido' };
    }

    return { valid: true };
  },

  /**
   * Valida ID de opción seleccionada
   */
  validateOptionIndex: (optionId: string): { valid: boolean; error?: string } => {
    if (!optionId || typeof optionId !== 'string') {
      return { valid: false, error: 'La opción seleccionada es requerida' };
    }

    // Validar formato UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(optionId)) {
      return { valid: false, error: 'ID de opción inválido' };
    }

    return { valid: true };
  },

  /**
   * Valida socket ID
   */
  validateSocketId: (socketId: string): { valid: boolean; error?: string } => {
    if (!socketId || typeof socketId !== 'string') {
      return { valid: false, error: 'Socket ID inválido' };
    }

    if (socketId.length < 10 || socketId.length > 50) {
      return { valid: false, error: 'Socket ID con formato incorrecto' };
    }

    return { valid: true };
  }
};
