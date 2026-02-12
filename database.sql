-- ============================================================================
-- Dating Cuba — Database Schema
-- ============================================================================
-- Ejecutar este archivo completo en el SQL Editor de Supabase.
-- Todas las tablas usan el schema "public" y tienen RLS habilitado.
-- ============================================================================

-- =========================
-- EXTENSIONES
-- =========================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "postgis";        -- Geolocalización (cálculos de distancia)

-- ============================================================================
-- 1. DATOS DE USUARIO
-- ============================================================================

-- ----- Tabla principal de usuarios -----
CREATE TABLE users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('hombre', 'mujer', 'otro')),
  show_me text NOT NULL CHECK (show_me IN ('hombres', 'mujeres', 'ambos')),
  bio text CHECK (char_length(bio) <= 300),
  work_study text,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_users_last_active ON users(last_active DESC);

-- ----- Ubicación del usuario -----
CREATE TABLE user_location (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  city text NOT NULL,          -- Formato: "municipio, provincia"
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_location_coords ON user_location(latitude, longitude);

-- ----- Fotos de perfil (máx 6) -----
CREATE TABLE user_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  url text NOT NULL,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 6),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, position)
);

CREATE INDEX idx_user_photos_user ON user_photos(user_id);

-- ----- Prompts personalizados (máx 3) -----
CREATE TABLE user_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  prompt_text text NOT NULL CHECK (char_length(prompt_text) <= 200),
  answer_text text NOT NULL CHECK (char_length(answer_text) <= 100),
  position smallint CHECK (position BETWEEN 1 AND 3),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, position)
);

-- ----- Intereses / tags -----
CREATE TABLE user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  interest text NOT NULL CHECK (char_length(interest) <= 50),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, interest)
);

CREATE INDEX idx_user_interests_user ON user_interests(user_id);

-- ----- Estadísticas de usuario -----
CREATE TABLE user_stats (
  user_id uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  likes_given integer DEFAULT 0,
  likes_received integer DEFAULT 0,
  superlikes_given integer DEFAULT 0,
  superlikes_received integer DEFAULT 0,
  matches_count integer DEFAULT 0,
  swipes_today integer DEFAULT 0,
  superlikes_today integer DEFAULT 0,
  last_reset date DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. SWIPES
-- ============================================================================

CREATE TABLE swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'nope', 'superlike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_id)
);

CREATE INDEX idx_swipes_user ON swipes(user_id, created_at DESC);
CREATE INDEX idx_swipes_target ON swipes(target_id, type);
CREATE INDEX idx_swipes_mutual ON swipes(target_id, user_id, type)
  WHERE type IN ('like', 'superlike');

-- ============================================================================
-- 3. MATCHES
-- ============================================================================

CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  unmatched boolean DEFAULT false,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_matches_user1 ON matches(user1_id) WHERE unmatched = false;
CREATE INDEX idx_matches_user2 ON matches(user2_id) WHERE unmatched = false;
CREATE INDEX idx_matches_recent ON matches(last_message_at DESC NULLS LAST);

-- ============================================================================
-- 4. MENSAJES
-- ============================================================================

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 1000),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_match ON messages(match_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(match_id, read) WHERE read = false;

-- ============================================================================
-- 5. MONETIZACIÓN
-- ============================================================================

CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('plus', 'vip')),
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'canceled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_status ON user_subscriptions(user_id, status);

-- ============================================================================
-- 6. CHISMES
-- ============================================================================

CREATE TABLE chismes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content jsonb NOT NULL,       -- { text, type, cta?, link? }
  image_url text,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  clicks integer DEFAULT 0,
  active boolean DEFAULT true,
  expires_at timestamptz,
  created_by uuid NOT NULL REFERENCES users(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_chismes_active ON chismes(active, created_at DESC);
CREATE INDEX idx_chismes_expires ON chismes(expires_at)
  WHERE expires_at IS NOT NULL;

-- ----- Interacciones con chismes -----
CREATE TABLE chisme_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chisme_id uuid NOT NULL REFERENCES chismes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('view', 'like', 'click', 'share')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(chisme_id, user_id, action)
);

CREATE INDEX idx_chisme_interactions ON chisme_interactions(chisme_id, action);

-- ============================================================================
-- 7. REPORTES Y BLOQUEOS
-- ============================================================================

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN (
    'perfil_falso', 'acoso', 'contenido_inapropiado',
    'spam', 'menor_de_edad', 'otro'
  )),
  description text CHECK (char_length(description) <= 500),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- ============================================================================
-- 8. TRIGGERS & FUNCIONES
-- ============================================================================

-- ----- Auto-crear registro en users al registrarse en auth -----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, display_name, date_of_birth, gender, show_me)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::date, '2000-01-01'::date),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'otro'),
    COALESCE(NEW.raw_user_meta_data->>'show_me', 'ambos')
  );

  -- Crear registro de stats vacío
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----- Auto-crear match cuando hay like mutuo -----
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
  reciprocal_like swipes;
BEGIN
  IF NEW.type IN ('like', 'superlike') THEN
    SELECT * INTO reciprocal_like
    FROM swipes
    WHERE user_id = NEW.target_id
      AND target_id = NEW.user_id
      AND type IN ('like', 'superlike');

    IF FOUND THEN
      INSERT INTO matches (user1_id, user2_id, created_at)
      VALUES (
        LEAST(NEW.user_id, NEW.target_id),
        GREATEST(NEW.user_id, NEW.target_id),
        now()
      )
      ON CONFLICT (user1_id, user2_id) DO NOTHING;

      UPDATE user_stats
      SET matches_count = matches_count + 1,
          updated_at = now()
      WHERE user_id IN (NEW.user_id, NEW.target_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_match_on_mutual_like
  AFTER INSERT ON swipes
  FOR EACH ROW EXECUTE FUNCTION check_and_create_match();

-- ----- Actualizar updated_at automáticamente -----
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_chismes
  BEFORE UPDATE ON chismes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----- Actualizar last_message_at en matches al enviar mensaje -----
CREATE OR REPLACE FUNCTION update_match_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE matches
  SET last_message_at = NEW.created_at
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_match_last_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_match_last_message();

-- ----- Incrementar stats al hacer swipe -----
CREATE OR REPLACE FUNCTION update_swipe_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset diario si cambió el día
  UPDATE user_stats
  SET swipes_today = 0,
      superlikes_today = 0,
      last_reset = CURRENT_DATE
  WHERE user_id = NEW.user_id
    AND last_reset < CURRENT_DATE;

  IF NEW.type = 'like' THEN
    UPDATE user_stats SET
      likes_given = likes_given + 1,
      swipes_today = swipes_today + 1,
      updated_at = now()
    WHERE user_id = NEW.user_id;

    UPDATE user_stats SET
      likes_received = likes_received + 1,
      updated_at = now()
    WHERE user_id = NEW.target_id;

  ELSIF NEW.type = 'superlike' THEN
    UPDATE user_stats SET
      superlikes_given = superlikes_given + 1,
      superlikes_today = superlikes_today + 1,
      swipes_today = swipes_today + 1,
      updated_at = now()
    WHERE user_id = NEW.user_id;

    UPDATE user_stats SET
      superlikes_received = superlikes_received + 1,
      updated_at = now()
    WHERE user_id = NEW.target_id;

  ELSIF NEW.type = 'nope' THEN
    UPDATE user_stats SET
      swipes_today = swipes_today + 1,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_stats_on_swipe
  AFTER INSERT ON swipes
  FOR EACH ROW EXECUTE FUNCTION update_swipe_stats();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chismes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chisme_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- ===== USERS =====
-- Cualquier usuario autenticado puede ver perfiles (para discover)
CREATE POLICY "users_select_authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Solo puedes editar tu propio perfil
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== USER_LOCATION =====
-- Usuarios autenticados pueden ver ubicaciones (para distancia)
CREATE POLICY "location_select_authenticated"
  ON user_location FOR SELECT
  TO authenticated
  USING (true);

-- Solo puedes manejar tu propia ubicación
CREATE POLICY "location_insert_own"
  ON user_location FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "location_update_own"
  ON user_location FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== USER_PHOTOS =====
-- Cualquier autenticado puede ver fotos (para discover/perfiles)
CREATE POLICY "photos_select_authenticated"
  ON user_photos FOR SELECT
  TO authenticated
  USING (true);

-- Solo puedes manejar tus propias fotos
CREATE POLICY "photos_insert_own"
  ON user_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "photos_update_own"
  ON user_photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "photos_delete_own"
  ON user_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===== USER_PROMPTS =====
CREATE POLICY "prompts_select_authenticated"
  ON user_prompts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "prompts_insert_own"
  ON user_prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompts_update_own"
  ON user_prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompts_delete_own"
  ON user_prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===== USER_INTERESTS =====
CREATE POLICY "interests_select_authenticated"
  ON user_interests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "interests_insert_own"
  ON user_interests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interests_delete_own"
  ON user_interests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===== USER_STATS =====
-- Solo puedes ver tus propias stats
CREATE POLICY "stats_select_own"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Las stats se actualizan por triggers (SECURITY DEFINER), no directamente
-- No policy de UPDATE para el usuario — solo triggers con SECURITY DEFINER

-- ===== SWIPES =====
-- Los swipes son completamente privados — solo puedes ver los tuyos
CREATE POLICY "swipes_select_own"
  ON swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Solo puedes crear swipes desde tu usuario
CREATE POLICY "swipes_insert_own"
  ON swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ===== MATCHES =====
-- Solo puedes ver matches donde participas
CREATE POLICY "matches_select_participant"
  ON matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Permitir unmatch (update unmatched = true) solo participantes
CREATE POLICY "matches_update_participant"
  ON matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ===== MESSAGES =====
-- Solo puedes ver mensajes de matches donde participas
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        AND matches.unmatched = false
    )
  );

-- Solo puedes enviar mensajes en matches donde participas
CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        AND matches.unmatched = false
    )
  );

-- ===== USER_SUBSCRIPTIONS =====
CREATE POLICY "subscriptions_select_own"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert/update manejado por webhooks de Stripe (service role), no por el usuario

-- ===== CHISMES =====
-- Cualquier autenticado puede ver chismes activos
CREATE POLICY "chismes_select_active"
  ON chismes FOR SELECT
  TO authenticated
  USING (active = true);

-- Solo el creador puede insertar
CREATE POLICY "chismes_insert_own"
  ON chismes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Solo el creador puede editar sus chismes
CREATE POLICY "chismes_update_own"
  ON chismes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- ===== CHISME_INTERACTIONS =====
CREATE POLICY "chisme_interactions_select_own"
  ON chisme_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "chisme_interactions_insert_own"
  ON chisme_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ===== REPORTS =====
-- Solo puedes ver tus propios reportes
CREATE POLICY "reports_select_own"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Cualquier autenticado puede crear reportes
CREATE POLICY "reports_insert_own"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- ===== BLOCKS =====
-- Solo puedes ver tus propios bloqueos
CREATE POLICY "blocks_select_own"
  ON blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "blocks_insert_own"
  ON blocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete_own"
  ON blocks FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- ============================================================================
-- 10. SUPABASE REALTIME
-- ============================================================================

-- Habilitar realtime para mensajes (chat en vivo)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Habilitar realtime para matches (notificación instantánea de match)
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
