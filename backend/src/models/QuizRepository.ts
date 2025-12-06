// ============================================================================
// QUIZ REPOSITORY
// GRASP: Information Expert + Repository Pattern
// Gestiona el acceso a datos de quizzes
// ============================================================================

import database from '../config/database';
import { Quiz, Question, QuestionOption } from '../../../shared/types';

export class QuizRepository {
  /**
   * Obtiene un quiz por ID con todas sus preguntas y opciones
   * @param quizId - ID del quiz
   * @returns Quiz completo o null si no existe
   */
  async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
      // Obtener quiz
      const quizResult = await database.query(
        'SELECT * FROM quizzes WHERE id = $1',
        [quizId]
      );

      if (quizResult.rows.length === 0) {
        return null;
      }

      const quizRow = quizResult.rows[0];

      // Obtener preguntas
      const questionsResult = await database.query(
        'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY order_index ASC',
        [quizId]
      );

      // Obtener todas las opciones de las preguntas
      const questions: Question[] = await Promise.all(
        questionsResult.rows.map(async (qRow) => {
          const optionsResult = await database.query(
            'SELECT * FROM question_options WHERE question_id = $1 ORDER BY order_index ASC',
            [qRow.id]
          );

          const options: QuestionOption[] = optionsResult.rows.map((oRow) => ({
            id: oRow.id,
            text: oRow.text,
            isCorrect: oRow.is_correct,
          }));

          return {
            id: qRow.id,
            text: qRow.text,
            options,
            timeLimit: qRow.time_limit,
            imageUrl: qRow.image_url,
          };
        })
      );

      const quiz: Quiz = {
        id: quizRow.id,
        title: quizRow.title,
        description: quizRow.description,
        questions,
        createdBy: quizRow.created_by,
        createdAt: quizRow.created_at,
        isPublic: quizRow.is_public,
      };

      return quiz;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }

  /**
   * Obtiene TODOS los quizzes (públicos y privados)
   * @returns Lista de todos los quizzes (sin preguntas)
   */
  async getAllQuizzes(): Promise<Omit<Quiz, 'questions'>[]> {
    try {
      const result = await database.query(
        'SELECT id, title, description, created_by, created_at, is_public FROM quizzes ORDER BY created_at DESC'
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        createdBy: row.created_by,
        createdAt: row.created_at,
        isPublic: row.is_public,
        questions: [],
      }));
    } catch (error) {
      console.error('Error fetching all quizzes:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los quizzes públicos
   * @returns Lista de quizzes públicos (sin preguntas)
   */
  async getPublicQuizzes(): Promise<Omit<Quiz, 'questions'>[]> {
    try {
      const result = await database.query(
        'SELECT id, title, description, created_by, created_at, is_public FROM quizzes WHERE is_public = true ORDER BY created_at DESC'
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        createdBy: row.created_by,
        createdAt: row.created_at,
        isPublic: row.is_public,
        questions: [],
      }));
    } catch (error) {
      console.error('Error fetching public quizzes:', error);
      throw error;
    }
  }

  /**
   * Obtiene quizzes creados por un usuario
   * @param createdBy - Identificador del creador
   * @returns Lista de quizzes del usuario
   */
  async getQuizzesByCreator(createdBy: string): Promise<Omit<Quiz, 'questions'>[]> {
    try {
      const result = await database.query(
        'SELECT id, title, description, created_by, created_at, is_public FROM quizzes WHERE created_by = $1 ORDER BY created_at DESC',
        [createdBy]
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        createdBy: row.created_by,
        createdAt: row.created_at,
        isPublic: row.is_public,
        questions: [],
      }));
    } catch (error) {
      console.error('Error fetching quizzes by creator:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo quiz con preguntas y opciones
   * @param quiz - Datos del quiz a crear
   * @returns Quiz creado
   */
  async createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<Quiz> {
    const client = await database.getPool().connect();

    try {
      await client.query('BEGIN');

      // Insertar quiz
      const quizResult = await client.query(
        'INSERT INTO quizzes (title, description, created_by, is_public) VALUES ($1, $2, $3, $4) RETURNING *',
        [quiz.title, quiz.description, quiz.createdBy, quiz.isPublic]
      );

      const quizRow = quizResult.rows[0];
      const createdQuestions: Question[] = [];

      // Insertar preguntas
      for (let i = 0; i < quiz.questions.length; i++) {
        const q = quiz.questions[i];
        const questionResult = await client.query(
          'INSERT INTO questions (quiz_id, text, image_url, time_limit, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [quizRow.id, q.text, q.imageUrl, q.timeLimit, i + 1]
        );

        const questionRow = questionResult.rows[0];
        const createdOptions: QuestionOption[] = [];

        // Insertar opciones
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          const optionResult = await client.query(
            'INSERT INTO question_options (question_id, text, is_correct, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
            [questionRow.id, opt.text, opt.isCorrect, j + 1]
          );

          const optionRow = optionResult.rows[0];
          createdOptions.push({
            id: optionRow.id,
            text: optionRow.text,
            isCorrect: optionRow.is_correct,
          });
        }

        createdQuestions.push({
          id: questionRow.id,
          text: questionRow.text,
          options: createdOptions,
          timeLimit: questionRow.time_limit,
          imageUrl: questionRow.image_url,
        });
      }

      await client.query('COMMIT');

      return {
        id: quizRow.id,
        title: quizRow.title,
        description: quizRow.description,
        questions: createdQuestions,
        createdBy: quizRow.created_by,
        createdAt: quizRow.created_at,
        isPublic: quizRow.is_public,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating quiz:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Elimina un quiz y todas sus preguntas/opciones (CASCADE)
   * @param quizId - ID del quiz a eliminar
   * @returns true si se eliminó correctamente
   */
  async deleteQuiz(quizId: string): Promise<boolean> {
    try {
      const result = await database.query('DELETE FROM quizzes WHERE id = $1', [quizId]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  }
}

// Singleton
export default new QuizRepository();
