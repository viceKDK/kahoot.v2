import express from 'express';
import PlayerRepository from '../models/PlayerRepository';

const router = express.Router();

/**
 * Obtiene las estadísticas de un jugador
 * GET /api/players/:userId/stats
 */
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await PlayerRepository.getPlayerStats(userId);
    
    if (!stats) {
      // Si no tiene stats, devolver un objeto vacío con valores en 0
      return res.json({
        success: true,
        data: {
          total_games_played: 0,
          total_wins: 0,
          total_podiums: 0,
          total_questions_answered: 0,
          total_correct_answers: 0,
          current_streak: 0,
          best_streak: 0,
          xp: 0,
          level: 1
        }
      });
    }

    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
