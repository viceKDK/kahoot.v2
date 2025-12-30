// ============================================================================
// PLAYER REPOSITORY
// GRASP: Information Expert - Gestiona persistencia de estadísticas de jugadores
// ============================================================================

import database from '../config/database';

export interface UpdateStatsParams {
  userId: string;
  isWin: boolean;
  isPodium: boolean;
  questionsAnswered: number;
  correctAnswers: number;
  bestStreak: number;
  xpEarned: number;
}

class PlayerRepository {
  /**
   * Actualiza las estadísticas de un jugador tras una partida
   */
  async updatePlayerStats(params: UpdateStatsParams): Promise<void> {
    const {
      userId,
      isWin,
      isPodium,
      questionsAnswered,
      correctAnswers,
      bestStreak,
      xpEarned,
    } = params;

    const query = `
      INSERT INTO player_stats (
        user_id, 
        total_games_played, 
        total_wins, 
        total_podiums, 
        total_questions_answered, 
        total_correct_answers, 
        best_streak, 
        xp, 
        level,
        last_played_at
      ) 
      VALUES ($1, 1, $2, $3, $4, $5, $6, $7, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        total_games_played = player_stats.total_games_played + 1,
        total_wins = player_stats.total_wins + $2,
        total_podiums = player_stats.total_podiums + $3,
        total_questions_answered = player_stats.total_questions_answered + $4,
        total_correct_answers = player_stats.total_correct_answers + $5,
        best_streak = GREATEST(player_stats.best_streak, $6),
        xp = player_stats.xp + $7,
        last_played_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
    `;

    // Calculamos los incrementos
    const winInc = isWin ? 1 : 0;
    const podiumInc = isPodium ? 1 : 0;

    await database.query(query, [
      userId,
      winInc,
      podiumInc,
      questionsAnswered,
      correctAnswers,
      bestStreak,
      xpEarned
    ]);

    // Opcional: Actualizar nivel basado en XP
    await this.updatePlayerLevel(userId);
  }

  /**
   * Actualiza el nivel del jugador basado en su XP total
   * Nivel = floor(sqrt(xp / 100)) + 1 (progresión simple)
   */
  private async updatePlayerLevel(userId: string): Promise<void> {
    const query = `
      UPDATE player_stats 
      SET level = FLOOR(SQRT(xp / 100.0)) + 1
      WHERE user_id = $1;
    `;
    await database.query(query, [userId]);
  }

  /**
   * Obtiene las estadísticas de un jugador
   */
  async getPlayerStats(userId: string): Promise<any | null> {
    const query = 'SELECT * FROM player_stats WHERE user_id = $1';
    const result = await database.query(query, [userId]);
    return result.rows[0] || null;
  }
}

export default new PlayerRepository();
