// ============================================================================
// GAME SESSION REPOSITORY
// GRASP: Information Expert + Repository Pattern
// Gestiona las sesiones de juego (solo metadata, jugadores en memoria)
// ============================================================================

import database from '../config/database';
import { GameStatus } from '../../../shared/types';

export interface GameSessionRecord {
  id: string;
  code: string;
  quizId: string;
  hostName: string;
  totalPlayers: number;
  status: GameStatus;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
}

export class GameSessionRepository {
  /**
   * Crea una nueva sesión de juego
   * @param code - Código de 6 dígitos
   * @param quizId - ID del quiz
   * @param hostName - Nombre del host
   * @returns Sesión creada
   */
  async createSession(
    code: string,
    quizId: string,
    hostName: string
  ): Promise<GameSessionRecord> {
    try {
      const result = await database.query(
        'INSERT INTO game_sessions (code, quiz_id, host_name, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [code, quizId, hostName, GameStatus.LOBBY]
      );

      return this.mapRow(result.rows[0]);
    } catch (error) {
      console.error('Error creating game session:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una sesión
   * @param code - Código de la sesión
   * @param status - Nuevo estado
   * @param totalPlayers - Número total de jugadores (opcional)
   */
  async updateSessionStatus(
    code: string,
    status: GameStatus,
    totalPlayers?: number
  ): Promise<void> {
    try {
      const updates: string[] = ['status = $2'];
      const params: any[] = [code, status];

      if (status === GameStatus.PLAYING) {
        updates.push('started_at = CURRENT_TIMESTAMP');
      }

      if (status === GameStatus.FINISHED) {
        updates.push('finished_at = CURRENT_TIMESTAMP');
      }

      if (totalPlayers !== undefined) {
        updates.push(`total_players = $${params.length + 1}`);
        params.push(totalPlayers);
      }

      const query = `UPDATE game_sessions SET ${updates.join(', ')} WHERE code = $1`;
      await database.query(query, params);
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }

  /**
   * Verifica si un código de sesión ya existe
   * @param code - Código a verificar
   * @returns true si existe
   */
  async codeExists(code: string): Promise<boolean> {
    try {
      const result = await database.query(
        'SELECT COUNT(*) as count FROM game_sessions WHERE code = $1',
        [code]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Error checking code existence:', error);
      throw error;
    }
  }

  /**
   * Obtiene una sesión por código
   * @param code - Código de la sesión
   * @returns Sesión o null
   */
  async getSessionByCode(code: string): Promise<GameSessionRecord | null> {
    try {
      const result = await database.query(
        'SELECT * FROM game_sessions WHERE code = $1',
        [code]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRow(result.rows[0]);
    } catch (error) {
      console.error('Error fetching session by code:', error);
      throw error;
    }
  }

  /**
   * Mapea una fila de la BD a GameSessionRecord
   */
  private mapRow(row: any): GameSessionRecord {
    return {
      id: row.id,
      code: row.code,
      quizId: row.quiz_id,
      hostName: row.host_name,
      totalPlayers: row.total_players,
      status: row.status as GameStatus,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      createdAt: row.created_at,
    };
  }
}

// Singleton
export default new GameSessionRepository();
