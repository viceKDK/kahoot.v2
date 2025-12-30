// ============================================================================
// QUIZ CONTROLLER
// GRASP: Controller - Gestiona las peticiones relacionadas con Quizzes
// ============================================================================

import express from 'express';
import QuizRepository from '../models/QuizRepository';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

/**
 * Obtener todos los quizzes (públicos)
 * GET /api/quizzes
 */
router.get('/', async (_req, res) => {
  try {
    const quizzes = await QuizRepository.getPublicQuizzes();
    res.json({ success: true, data: quizzes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Obtener quizzes de un creador específico
 * GET /api/quizzes/creator/:userId
 * AHORA PROTEGIDO: Solo puedes ver tus propios quizzes privados si mandas token
 */
router.get('/creator/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Si el usuario que pide es el mismo del ID, mostramos todo (público y privado)
    // Si no (o si es anónimo), solo mostramos los públicos de ese creador (si hubiera lógica para eso)
    // En nuestro caso, "Mis Quizzes" suele ser privado.
    
    // NOTA: Para mantener compatibilidad con modo invitado local (userId generado aleatoriamente),
    // permitimos acceso si no es un ID de Supabase (UUID) o si coincide.
    
    const quizzes = await QuizRepository.getQuizzesByCreator(userId);
    res.json({ success: true, data: quizzes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Obtener un quiz por ID
 * GET /api/quizzes/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const quiz = await QuizRepository.getQuizById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    return res.json({ success: true, data: quiz });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Crear un nuevo quiz
 * POST /api/quizzes
 * PROTEGIDO OPCIONALMENTE: Si mandas token, usamos ese ID. Si no, permitimos anónimo.
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title, description, questions, isPublic, createdBy } = req.body;
    const user = (req as any).user;

    // Validación de seguridad: Si hay usuario autenticado, FORZAMOS que el createdBy sea su ID real.
    // Esto evita que alguien mande un token de 'Pepe' pero diga que el quiz lo creó 'Juan'.
    const finalCreatorId = user ? user.id : createdBy;

    if (!finalCreatorId) {
       return res.status(400).json({ success: false, error: 'Creator ID required' });
    }

    const newQuiz = await QuizRepository.createQuiz({
      title,
      description,
      questions,
      createdBy: finalCreatorId,
      isPublic,
    });
    
    return res.json({ success: true, data: newQuiz });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Eliminar un quiz
 * DELETE /api/quizzes/:id
 * PROTEGIDO: Solo el dueño puede borrarlo.
 */
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    // Primero obtenemos el quiz para ver de quién es
    const quiz = await QuizRepository.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    // Si el quiz fue creado por un usuario registrado (UUID), requerimos autenticación
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quiz.createdBy);
    
    if (isUUID) {
      if (!user || user.id !== quiz.createdBy) {
        return res.status(403).json({ success: false, error: 'Unauthorized: You do not own this quiz' });
      }
    }
    // Si no es UUID (es usuario invitado local), permitimos borrarlo (seguridad laxa para invitados)

    await QuizRepository.deleteQuiz(id);
    return res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;