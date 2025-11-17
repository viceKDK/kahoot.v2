// ============================================================================
// USER STORAGE UTILITY
// Gestiona el "usuario" en localStorage (para tracking de quizzes creados)
// ============================================================================

const USER_KEY = 'quizarena_user_id';

export const UserStorage = {
  /**
   * Obtiene o crea un ID de usuario
   * @returns ID único del usuario
   */
  getUserId(): string {
    if (typeof window === 'undefined') return 'anonymous';

    let userId = localStorage.getItem(USER_KEY);

    if (!userId) {
      // Generar ID único
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem(USER_KEY, userId);
    }

    return userId;
  },

  /**
   * Obtiene o crea un nombre de usuario
   */
  getUserName(): string {
    if (typeof window === 'undefined') return 'Usuario';

    const userName = localStorage.getItem('quizarena_user_name');
    return userName || 'Usuario';
  },

  /**
   * Guarda el nombre del usuario
   */
  setUserName(name: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quizarena_user_name', name);
    }
  },

  /**
   * Limpia los datos del usuario
   */
  clearUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('quizarena_user_name');
    }
  },
};
