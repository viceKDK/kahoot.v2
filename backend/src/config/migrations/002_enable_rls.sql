-- ============================================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- Protege las tablas para que no puedan ser modificadas arbitrariamente
-- desde el cliente (navegador) usando la Anon Key.
-- ============================================================================

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS PARA QUIZZES
-- ============================================================================

-- Lectura: Cualquiera puede ver quizzes PÚBLICOS
CREATE POLICY "Public quizzes are viewable by everyone" 
ON quizzes FOR SELECT 
USING (is_public = true);

-- Lectura: Usuarios autenticados pueden ver sus PROPIOS quizzes (públicos o privados)
CREATE POLICY "Users can view own quizzes" 
ON quizzes FOR SELECT 
USING (auth.uid()::text = created_by);

-- Escritura: Solo usuarios autenticados pueden crear quizzes
CREATE POLICY "Users can create quizzes" 
ON quizzes FOR INSERT 
WITH CHECK (auth.uid()::text = created_by);

-- Modificación/Borrado: Solo el dueño puede editar/borrar
CREATE POLICY "Users can update own quizzes" 
ON quizzes FOR UPDATE 
USING (auth.uid()::text = created_by);

CREATE POLICY "Users can delete own quizzes" 
ON quizzes FOR DELETE 
USING (auth.uid()::text = created_by);

-- ============================================================================
-- POLÍTICAS PARA QUESTIONS Y OPTIONS
-- (Heredan permisos del Quiz padre)
-- ============================================================================

-- Lectura: Si puedes ver el quiz, puedes ver sus preguntas
CREATE POLICY "Questions viewable if quiz is viewable"
ON questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = questions.quiz_id 
    AND (quizzes.is_public = true OR quizzes.created_by = auth.uid()::text)
  )
);

-- Escritura: Solo el dueño del quiz puede tocar las preguntas
CREATE POLICY "Questions modifiable by quiz owner"
ON questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = questions.quiz_id 
    AND quizzes.created_by = auth.uid()::text
  )
);

-- Lo mismo para opciones
CREATE POLICY "Options viewable if quiz is viewable"
ON question_options FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM questions 
    JOIN quizzes ON questions.quiz_id = quizzes.id
    WHERE questions.id = question_options.question_id
    AND (quizzes.is_public = true OR quizzes.created_by = auth.uid()::text)
  )
);

CREATE POLICY "Options modifiable by quiz owner"
ON question_options FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM questions 
    JOIN quizzes ON questions.quiz_id = quizzes.id
    WHERE questions.id = question_options.question_id
    AND quizzes.created_by = auth.uid()::text
  )
);

-- ============================================================================
-- POLÍTICAS PARA PLAYER_STATS
-- ============================================================================

-- Lectura: Pública (para ver perfiles de otros)
CREATE POLICY "Stats are public" 
ON player_stats FOR SELECT 
USING (true);

-- Escritura: BLOQUEADA desde el cliente.
-- Solo el backend (Service Role / Postgres User) puede modificar stats.
-- Esto evita que un usuario se edite su propio XP desde la consola del navegador.
CREATE POLICY "Stats strictly managed by server" 
ON player_stats FOR ALL 
USING (false) -- Nadie desde la API pública
WITH CHECK (false);

-- ============================================================================
-- POLÍTICAS PARA GAME_SESSIONS
-- ============================================================================

-- Lectura: Pública (necesario para buscar sala por código)
CREATE POLICY "Sessions are public" 
ON game_sessions FOR SELECT 
USING (true);

-- Escritura: BLOQUEADA al cliente. Solo el backend gestiona sesiones.
CREATE POLICY "Sessions managed by server" 
ON game_sessions FOR ALL 
USING (false);
