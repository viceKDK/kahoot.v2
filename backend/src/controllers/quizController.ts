// ============================================================================
// QUIZ CONTROLLER
// REST API endpoints para gestión de quizzes
// ============================================================================

import { Router, Request, Response } from 'express';
import QuizRepository from '../models/QuizRepository';
import { Quiz } from '../../../shared/types';

const router = Router();

/**
 * GET /api/quizzes
 * Obtiene TODOS los quizzes (públicos y privados)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const quizzes = await QuizRepository.getAllQuizzes();
    return res.json({ success: true, data: quizzes });
  } catch (error: any) {
    console.error('Error fetching all quizzes:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/quizzes/public
 * Obtiene todos los quizzes públicos
 */
router.get('/public', async (_req: Request, res: Response) => {
  try {
    const quizzes = await QuizRepository.getPublicQuizzes();
    return res.json({ success: true, data: quizzes });
  } catch (error: any) {
    console.error('Error fetching public quizzes:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/quizzes/:id
 * Obtiene un quiz por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const quiz = await QuizRepository.getQuizById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    return res.json({ success: true, data: quiz });
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/quizzes/creator/:creatorId
 * Obtiene quizzes creados por un usuario
 */
router.get('/creator/:creatorId', async (req: Request, res: Response) => {
  try {
    const quizzes = await QuizRepository.getQuizzesByCreator(req.params.creatorId);
    res.json({ success: true, data: quizzes });
  } catch (error: any) {
    console.error('Error fetching quizzes by creator:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/quizzes
 * Crea un nuevo quiz
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const quizData = req.body as Omit<Quiz, 'id' | 'createdAt'>;

    // Validaciones básicas
    if (!quizData.title || !quizData.questions || quizData.questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title and at least one question are required',
      });
    }

    // Validar que cada pregunta tenga 4 opciones
    for (const question of quizData.questions) {
      if (!question.options || question.options.length !== 4) {
        return res.status(400).json({
          success: false,
          error: 'Each question must have exactly 4 options',
        });
      }

      // Validar que haya exactamente una respuesta correcta
      const correctCount = question.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        return res.status(400).json({
          success: false,
          error: 'Each question must have exactly 1 correct option',
        });
      }
    }

    const createdQuiz = await QuizRepository.createQuiz(quizData);
    return res.status(201).json({ success: true, data: createdQuiz });
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/quizzes/:id
 * Elimina un quiz
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await QuizRepository.deleteQuiz(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    return res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
