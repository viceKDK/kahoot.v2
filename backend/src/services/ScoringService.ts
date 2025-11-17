// ============================================================================
// SCORING SERVICE
// GRASP: Information Expert - Calcula puntos basándose en velocidad y rachas
// SOLID: Single Responsibility - Solo se encarga de calcular puntos
// ============================================================================

import { SCORING } from '../../../shared/types';

export class ScoringService {
  /**
   * Calcula los puntos ganados por una respuesta correcta
   *
   * SISTEMA DE VELOCIDAD:
   * - Base: 1000 puntos
   * - Penalización lineal: Cada segundo resta puntos proporcionalmente
   * - Responder inmediatamente = 1000 pts
   * - Responder al final = MIN_POINTS
   *
   * SISTEMA DE RACHAS:
   * - Multiplicador progresivo: +10% por cada racha
   * - Racha 1: x1.1, Racha 2: x1.2, Racha 3: x1.3, etc.
   * - Máximo: x2.0 (racha 10+)
   *
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
    // ========================================
    // 1. CALCULAR PUNTOS POR VELOCIDAD
    // ========================================

    // Convertir tiempo a segundos para mejor comprensión
    const timeLimitSeconds = timeLimit / 1000;
    const timeElapsedSeconds = Math.min(timeElapsed / 1000, timeLimitSeconds);

    // Calcular penalización por segundo
    const pointsRange = SCORING.BASE_POINTS - SCORING.MIN_POINTS;
    const pointsPerSecond = pointsRange / timeLimitSeconds;

    // Puntos = BASE_POINTS - (segundos_transcurridos * puntos_por_segundo)
    let points = SCORING.BASE_POINTS - (timeElapsedSeconds * pointsPerSecond);

    // Asegurar que no baje del mínimo
    points = Math.max(points, SCORING.MIN_POINTS);

    // ========================================
    // 2. APLICAR MULTIPLICADOR DE RACHAS
    // ========================================

    if (currentStreak > 0) {
      // Multiplicador = 1 + (racha * 0.10)
      // Racha 1 = 1.1x, Racha 2 = 1.2x, Racha 3 = 1.3x, etc.
      const streakMultiplier = Math.min(
        1 + (currentStreak * SCORING.STREAK_MULTIPLIER),
        SCORING.MAX_STREAK_MULTIPLIER
      );

      points *= streakMultiplier;
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
