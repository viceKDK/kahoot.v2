// ============================================================================
// SCORING SERVICE
// GRASP: Information Expert - Calcula puntos basándose en velocidad y rachas
// SOLID: Single Responsibility - Solo se encarga de calcular puntos
// ============================================================================

import { SCORING } from '../../../shared/types';

export class ScoringService {
  /**
   * Calcula los puntos ganados por una respuesta correcta
   * @param timeLimit - Tiempo límite de la pregunta (ms)
   * @param timeElapsed - Tiempo que tardó el jugador en responder (ms)
   * @param currentStreak - Racha actual del jugador
   * @returns Puntos ganados
   */
  calculatePoints(
    timeLimit: number,
    timeElapsed: number,
    currentStreak: number
  ): number {
    // Puntos base por respuesta correcta
    let points = SCORING.BASE_POINTS;

    // Bonus por velocidad (50% del tiempo restante)
    const timeRemaining = Math.max(0, timeLimit - timeElapsed);
    const speedBonus = Math.floor(
      (timeRemaining / timeLimit) * SCORING.BASE_POINTS * SCORING.SPEED_MULTIPLIER
    );
    points += speedBonus;

    // Bonus por racha (después de 3 respuestas correctas seguidas)
    if (currentStreak >= SCORING.STREAK_THRESHOLD) {
      const streakMultiplier = currentStreak - SCORING.STREAK_THRESHOLD + 1;
      points += SCORING.STREAK_BONUS * streakMultiplier;
    }

    return Math.floor(points);
  }

  /**
   * Calcula la precisión (accuracy) de un jugador
   * @param correctAnswers - Número de respuestas correctas
   * @param totalAnswers - Número total de respuestas
   * @returns Porcentaje de precisión (0-100)
   */
  calculateAccuracy(correctAnswers: number, totalAnswers: number): number {
    if (totalAnswers === 0) return 0;
    return Math.round((correctAnswers / totalAnswers) * 100);
  }

  /**
   * Actualiza la racha de un jugador
   * @param currentStreak - Racha actual
   * @param isCorrect - Si la respuesta fue correcta
   * @returns Nueva racha
   */
  updateStreak(currentStreak: number, isCorrect: boolean): number {
    if (isCorrect) {
      return currentStreak + 1;
    }
    return 0; // Racha se resetea si falla
  }
}

// Singleton
export default new ScoringService();
