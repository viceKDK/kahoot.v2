// ============================================================================
// QUIZ CONTROLLER
// REST API endpoints para gestión de quizzes
// ============================================================================

import { Router, Request, Response } from 'express';
import QuizRepository from '../models/QuizRepository';
import { Quiz } from '../../../shared/types';
import { quizCreationLimiter, listLimiter, authLimiter } from '../middleware/rateLimiter';
import {
  validateQuizCreation,
  validateGetQuiz,
  validateGetQuizzesByCreator,
  validateDeleteQuiz,
} from '../middleware/validators';

const router = Router();

/**
 * GET /api/quizzes/public
 * Obtiene todos los quizzes públicos
 * Rate limited: 30 requests/minuto
 */
router.get('/public', listLimiter, async (_req: Request, res: Response) => {
  try {
    const quizzes = await QuizRepository.getPublicQuizzes();
    res.json({ success: true, data: quizzes });
  } catch (error: any) {
    console.error('Error fetching public quizzes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/quizzes/creator/:creatorId
 * Obtiene quizzes creados por un usuario
 * Rate limited: 30 requests/minuto
 * NOTA: Esta ruta debe estar ANTES de /:id para evitar conflictos
 */
router.get('/creator/:creatorId', listLimiter, validateGetQuizzesByCreator, async (req: Request, res: Response) => {
  try {
    const quizzes = await QuizRepository.getQuizzesByCreator(req.params.creatorId);
    res.json({ success: true, data: quizzes });
  } catch (error: any) {
    console.error('Error fetching quizzes by creator:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/quizzes/:id
 * Obtiene un quiz por ID
 * Validación: UUID válido
 */
router.get('/:id', validateGetQuiz, async (req: Request, res: Response): Promise<void> => {
  try {
    const quiz = await QuizRepository.getQuizById(req.params.id);
    if (!quiz) {
      res.status(404).json({ success: false, error: 'Quiz not found' });
      return;
    }
    res.json({ success: true, data: quiz });
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/quizzes
 * Crea un nuevo quiz
 * Rate limited: 10 quizzes/hora
 * Validación completa de estructura
 */
router.post('/', quizCreationLimiter, validateQuizCreation, async (req: Request, res: Response) => {
  try {
    const quizData = req.body as Omit<Quiz, 'id' | 'createdAt'>;

    // Las validaciones ahora se hacen en el middleware validateQuizCreation
    const createdQuiz = await QuizRepository.createQuiz(quizData);
    res.status(201).json({ success: true, data: createdQuiz });
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/quizzes/:id
 * Elimina un quiz
 * Rate limited: 5 requests/5 minutos
 * Validación: UUID válido
 */
router.delete('/:id', authLimiter, validateDeleteQuiz, async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await QuizRepository.deleteQuiz(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Quiz not found' });
      return;
    }
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
