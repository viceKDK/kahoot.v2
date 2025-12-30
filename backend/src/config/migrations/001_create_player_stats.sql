-- ============================================================================
-- MIGRACIÓN: PLAYER STATS
-- Tabla para guardar estadísticas persistentes de usuarios registrados
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_stats (
  user_id UUID PRIMARY KEY, -- Vinculado al auth.users de Supabase
  display_name VARCHAR(100),
  avatar_url TEXT,
  total_games_played INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_podiums INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0, -- Racha actual
  best_streak INTEGER DEFAULT 0,    -- Mejor racha histórica
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_played_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para buscar rápido por XP (Ranking global)
CREATE INDEX IF NOT EXISTS idx_player_stats_xp ON player_stats(xp DESC);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_player_stats_updated_at ON player_stats;
CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
