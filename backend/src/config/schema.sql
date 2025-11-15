-- ============================================================================
-- QuizArena Database Schema
-- PostgreSQL Schema para almacenar quizzes (usuarios no persisten)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- QUIZZES TABLE
-- Almacena los quizzes creados por los usuarios
-- ============================================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(255) NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- QUESTIONS TABLE
-- Preguntas de cada quiz
-- ============================================================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  time_limit INTEGER DEFAULT 30000, -- milliseconds
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- QUESTION_OPTIONS TABLE
-- Opciones de respuesta para cada pregunta (siempre 4)
-- ============================================================================
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text VARCHAR(500) NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GAME_SESSIONS TABLE (opcional, para stats)
-- Registro de partidas jugadas (solo metadata, no jugadores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  host_name VARCHAR(100) NOT NULL,
  total_players INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'LOBBY',
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES para mejorar performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_code ON game_sessions(code);
CREATE INDEX IF NOT EXISTS idx_game_sessions_quiz_id ON game_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);

-- ============================================================================
-- TRIGGER para actualizar updated_at automáticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATOS DE EJEMPLO: Quiz de prueba
-- ============================================================================
INSERT INTO quizzes (id, title, description, created_by, is_public)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000',
   'Quiz de Cultura General',
   'Quiz básico para probar QuizArena',
   'demo_user',
   true)
ON CONFLICT DO NOTHING;

-- Preguntas del quiz de ejemplo
INSERT INTO questions (id, quiz_id, text, time_limit, order_index)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '¿Cuál es la capital de Francia?', 15000, 1),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '¿Cuántos continentes hay en el mundo?', 15000, 2),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '¿Qué planeta es conocido como el planeta rojo?', 15000, 3),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '¿Cuál es el océano más grande?', 15000, 4),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', '¿En qué año llegó el hombre a la Luna?', 20000, 5)
ON CONFLICT DO NOTHING;

-- Opciones para pregunta 1 (Capital de Francia)
INSERT INTO question_options (question_id, text, is_correct, order_index)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Londres', false, 1),
  ('550e8400-e29b-41d4-a716-446655440001', 'París', true, 2),
  ('550e8400-e29b-41d4-a716-446655440001', 'Berlín', false, 3),
  ('550e8400-e29b-41d4-a716-446655440001', 'Madrid', false, 4)
ON CONFLICT DO NOTHING;

-- Opciones para pregunta 2 (Continentes)
INSERT INTO question_options (question_id, text, is_correct, order_index)
VALUES
  ('550e8400-e29b-41d4-a716-446655440002', '5', false, 1),
  ('550e8400-e29b-41d4-a716-446655440002', '6', false, 2),
  ('550e8400-e29b-41d4-a716-446655440002', '7', true, 3),
  ('550e8400-e29b-41d4-a716-446655440002', '8', false, 4)
ON CONFLICT DO NOTHING;

-- Opciones para pregunta 3 (Planeta rojo)
INSERT INTO question_options (question_id, text, is_correct, order_index)
VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Venus', false, 1),
  ('550e8400-e29b-41d4-a716-446655440003', 'Marte', true, 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Júpiter', false, 3),
  ('550e8400-e29b-41d4-a716-446655440003', 'Saturno', false, 4)
ON CONFLICT DO NOTHING;

-- Opciones para pregunta 4 (Océano más grande)
INSERT INTO question_options (question_id, text, is_correct, order_index)
VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'Atlántico', false, 1),
  ('550e8400-e29b-41d4-a716-446655440004', 'Índico', false, 2),
  ('550e8400-e29b-41d4-a716-446655440004', 'Pacífico', true, 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'Ártico', false, 4)
ON CONFLICT DO NOTHING;

-- Opciones para pregunta 5 (Hombre a la Luna)
INSERT INTO question_options (question_id, text, is_correct, order_index)
VALUES
  ('550e8400-e29b-41d4-a716-446655440005', '1965', false, 1),
  ('550e8400-e29b-41d4-a716-446655440005', '1969', true, 2),
  ('550e8400-e29b-41d4-a716-446655440005', '1972', false, 3),
  ('550e8400-e29b-41d4-a716-446655440005', '1975', false, 4)
ON CONFLICT DO NOTHING;
