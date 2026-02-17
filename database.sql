-- ============================================================================
-- Empatando — Database Schema
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
  phone text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
  suspended_until timestamptz,
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

-- PostGIS geometry column + GiST index for spatial queries (Medida 2)
ALTER TABLE user_location ADD COLUMN geom geometry(Point, 4326);

-- Auto-populate geom from lat/lng on insert/update
CREATE OR REPLACE FUNCTION update_location_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_location_geom
  BEFORE INSERT OR UPDATE OF latitude, longitude ON user_location
  FOR EACH ROW EXECUTE FUNCTION update_location_geom();

-- GiST index — O(log n) spatial lookups instead of full table scan
CREATE INDEX idx_user_location_geom ON user_location USING GIST (geom);

-- Backfill existing rows (run once after creating column)
UPDATE user_location
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geom IS NULL;

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
  payment_method text NOT NULL DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'cup_manual')),
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
    'fake', 'inappropriate', 'harassment', 'minor', 'spam', 'other'
  )),
  details text,
  status text DEFAULT 'pending' CHECK (
    status IN ('pending', 'reviewed', 'action_taken', 'dismissed')
  ),
  reviewed_by uuid REFERENCES users(user_id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX idx_reports_reported ON reports(reported_id);

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

-- Puedes eliminar tus propios swipes (rewind)
CREATE POLICY "swipes_delete_own"
  ON swipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Puedes ver swipes que te apuntan (para "ver quién te dio like")
CREATE POLICY "swipes_select_target"
  ON swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = target_id AND type IN ('like', 'superlike'));

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
-- 10. STRIPE (Tablas financieras — separadas de user_subscriptions)
-- ============================================================================

-- ----- Mapeo usuario → cliente de Stripe -----
CREATE TABLE stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ----- Suscripciones de Stripe (tracking financiero) -----
CREATE TABLE stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  stripe_price_id text,
  status text NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_stripe_subs_user ON stripe_subscriptions(user_id);
CREATE INDEX idx_stripe_subs_status ON stripe_subscriptions(status);

-- ----- Historial de pagos de Stripe -----
CREATE TABLE stripe_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE,
  stripe_invoice_id text,
  amount integer NOT NULL,        -- en centavos (ej: 200 = $2.00)
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_stripe_payments_user ON stripe_payments(user_id);

-- ----- Precios en CUP (gestionados por admin) -----
CREATE TABLE cup_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL UNIQUE CHECK (plan IN ('plus', 'vip')),
  price_cup integer NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(user_id)
);

-- Valores iniciales
INSERT INTO cup_prices (plan, price_cup) VALUES ('plus', 1000);
INSERT INTO cup_prices (plan, price_cup) VALUES ('vip', 4000);

-- RLS para tablas de Stripe (solo service role puede escribir, usuarios leen sus propios)
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_customers_select_own"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "stripe_subs_select_own"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "stripe_payments_select_own"
  ON stripe_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- CUP prices — cualquier autenticado puede leer precios
CREATE POLICY "cup_prices_select_all"
  ON cup_prices FOR SELECT
  TO authenticated
  USING (true);

-- CUP prices — solo admins pueden actualizar (via server action con service role)

-- Trigger updated_at para stripe_subscriptions
CREATE TRIGGER set_updated_at_stripe_subs
  BEFORE UPDATE ON stripe_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 11. ADMIN RLS POLICIES
-- ============================================================================
-- Los admins necesitan acceso ampliado para moderación y gestión.
-- Estas policies permiten a los admins leer/actualizar datos necesarios.
-- Las acciones de admin se ejecutan via server actions con service_role,
-- pero estas policies cubren queries directas desde el cliente admin.

-- Admins pueden ver todos los reportes
CREATE POLICY "reports_select_admin"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins pueden actualizar reportes (marcar como reviewed/resolved)
CREATE POLICY "reports_update_admin"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins pueden actualizar status de usuarios (suspend/block)
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 12. PUSH NOTIFICATIONS & USER SETTINGS
-- ============================================================================

-- ----- Push subscriptions (Web Push API) -----
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subs_select_own"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "push_subs_insert_own"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subs_delete_own"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ----- Notification log (frequency limiting) -----
CREATE TABLE notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type text NOT NULL,
  sent_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notification_log_user_time ON notification_log(user_id, sent_at DESC);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
-- Solo accesible via service role (API routes)

-- ----- User settings -----
CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  notifications_enabled boolean DEFAULT true,
  notifications_matches boolean DEFAULT true,
  notifications_messages boolean DEFAULT true,
  notifications_chismes boolean DEFAULT true,
  notifications_promotions boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select_own"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert_own"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_own"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER set_updated_at_user_settings
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 13. BOOSTS & PREMIUM INVENTORY
-- ============================================================================

-- ----- Inventario de boosts y superlikes disponibles -----
CREATE TABLE user_premium_inventory (
  user_id uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  boosts_available integer DEFAULT 0,
  superlikes_available integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_premium_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "premium_inventory_select_own"
  ON user_premium_inventory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Updates via service role (purchase flow)

CREATE TRIGGER set_updated_at_premium_inventory
  BEFORE UPDATE ON user_premium_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----- Registro de boosts activados -----
CREATE TABLE boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  multiplier decimal(3,1) NOT NULL DEFAULT 3.0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_boosts_active ON boosts(user_id, expires_at DESC);
CREATE INDEX idx_boosts_expires ON boosts(expires_at) WHERE expires_at > now();

ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boosts_select_own"
  ON boosts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert via service role (activate boost action)

-- ----- Índice para discovery: buscar boosts activos de otros usuarios -----
-- Usado por el algoritmo de matching para priorizar usuarios con boost activo
CREATE INDEX idx_boosts_active_lookup ON boosts(expires_at, user_id)
  WHERE expires_at > now();

-- ============================================================================
-- 14. REWIND — Trigger para revertir stats al eliminar swipe
-- ============================================================================

CREATE OR REPLACE FUNCTION revert_swipe_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.type = 'like' THEN
    UPDATE user_stats SET
      likes_given = GREATEST(0, likes_given - 1),
      swipes_today = GREATEST(0, swipes_today - 1),
      updated_at = now()
    WHERE user_id = OLD.user_id;

    UPDATE user_stats SET
      likes_received = GREATEST(0, likes_received - 1),
      updated_at = now()
    WHERE user_id = OLD.target_id;

  ELSIF OLD.type = 'superlike' THEN
    UPDATE user_stats SET
      superlikes_given = GREATEST(0, superlikes_given - 1),
      superlikes_today = GREATEST(0, superlikes_today - 1),
      swipes_today = GREATEST(0, swipes_today - 1),
      updated_at = now()
    WHERE user_id = OLD.user_id;

    UPDATE user_stats SET
      superlikes_received = GREATEST(0, superlikes_received - 1),
      updated_at = now()
    WHERE user_id = OLD.target_id;

  ELSIF OLD.type = 'nope' THEN
    UPDATE user_stats SET
      swipes_today = GREATEST(0, swipes_today - 1),
      updated_at = now()
    WHERE user_id = OLD.user_id;
  END IF;

  -- Unmatch if there was a match created from this swipe
  UPDATE matches SET unmatched = true
  WHERE user1_id = LEAST(OLD.user_id, OLD.target_id)
    AND user2_id = GREATEST(OLD.user_id, OLD.target_id)
    AND unmatched = false;

  -- Decrement match count if a match was removed
  IF FOUND THEN
    UPDATE user_stats SET
      matches_count = GREATEST(0, matches_count - 1),
      updated_at = now()
    WHERE user_id IN (OLD.user_id, OLD.target_id);
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER revert_stats_on_swipe_delete
  AFTER DELETE ON swipes
  FOR EACH ROW EXECUTE FUNCTION revert_swipe_stats();

-- ============================================================================
-- 15. SUPABASE REALTIME
-- ============================================================================

-- Habilitar realtime para mensajes (chat en vivo)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Habilitar realtime para matches (notificación instantánea de match)
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- ============================================================================
-- 16. CRON JOBS — Reseteo de likes y superlikes
-- ============================================================================
-- Requiere la extensión pg_cron habilitada en Supabase.
-- Ejecutar estos comandos manualmente en el SQL Editor de Supabase
-- ya que pg_cron no se puede crear en una migración estándar.
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- -- Resetear contador de likes cada 12 horas (00:00 y 12:00 UTC)
-- SELECT cron.schedule(
--   'reset-likes-counter',
--   '0 0,12 * * *',
--   $$UPDATE user_stats SET swipes_today = 0$$
-- );
--
-- -- Resetear contador de superlikes cada 24 horas (00:00 UTC)
-- SELECT cron.schedule(
--   'reset-superlikes-counter',
--   '0 0 * * *',
--   $$UPDATE user_stats SET superlikes_today = 0$$
-- );

-- ============================================================================
-- 17. PARTICIONAMIENTO DE SWIPES (Medida 7)
-- ============================================================================
-- Con 50k MAU × ~50 swipes/día = 2.5M swipes/día, la tabla crece rápido.
-- Particionar por mes mantiene las queries rápidas.
--
-- IMPORTANTE: Ejecutar esta migración DESPUÉS de crear la tabla swipes original.
-- Esto renombra la tabla original, crea la particionada, y migra los datos.
--
-- Paso 1: Renombrar tabla original
-- ALTER TABLE swipes RENAME TO swipes_old;
--
-- Paso 2: Crear tabla particionada
-- CREATE TABLE swipes (
--   id uuid DEFAULT gen_random_uuid(),
--   user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
--   target_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
--   type text NOT NULL CHECK (type IN ('like', 'nope', 'superlike')),
--   created_at timestamptz DEFAULT now(),
--   PRIMARY KEY (id, created_at),
--   UNIQUE(user_id, target_id, created_at)
-- ) PARTITION BY RANGE (created_at);
--
-- Paso 3: Crear particiones mensuales (automatizar con pg_cron)
-- CREATE TABLE swipes_2026_01 PARTITION OF swipes
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- CREATE TABLE swipes_2026_02 PARTITION OF swipes
--   FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- CREATE TABLE swipes_2026_03 PARTITION OF swipes
--   FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
-- ... (crear particiones por adelantado para los próximos 6 meses)
--
-- Paso 4: Migrar datos existentes
-- INSERT INTO swipes SELECT * FROM swipes_old;
--
-- Paso 5: Re-crear índices en cada partición (se heredan automáticamente)
-- CREATE INDEX ON swipes(user_id, created_at DESC);
-- CREATE INDEX ON swipes(target_id, type);
-- CREATE INDEX ON swipes(target_id, user_id, type) WHERE type IN ('like', 'superlike');
--
-- Paso 6: Re-crear triggers
-- (Los triggers del paso 8 ya aplican a la tabla particionada)
--
-- Paso 7: Verificar y eliminar tabla vieja
-- DROP TABLE swipes_old;
--
-- Cron para crear particiones automáticas cada mes:
-- SELECT cron.schedule(
--   'create-swipes-partition',
--   '0 0 25 * *',  -- Día 25 de cada mes, crea partición del mes siguiente
--   $$
--   DO $part$
--   DECLARE
--     next_month date := date_trunc('month', now()) + interval '1 month';
--     partition_name text := 'swipes_' || to_char(next_month, 'YYYY_MM');
--     start_date text := to_char(next_month, 'YYYY-MM-DD');
--     end_date text := to_char(next_month + interval '1 month', 'YYYY-MM-DD');
--   BEGIN
--     EXECUTE format(
--       'CREATE TABLE IF NOT EXISTS %I PARTITION OF swipes FOR VALUES FROM (%L) TO (%L)',
--       partition_name, start_date, end_date
--     );
--   END
--   $part$;
--   $$
-- );

-- ============================================================================
-- 18. MODO PAREJA — Tablas de Couple Mode
-- ============================================================================

-- ----- Solicitudes de vinculación de pareja -----
CREATE TABLE couple_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  target_phone text NOT NULL,
  target_name text NOT NULL,
  target_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

CREATE INDEX idx_couple_requests_target ON couple_requests(target_id, status);
CREATE INDEX idx_couple_requests_requester ON couple_requests(requester_id, status);

ALTER TABLE couple_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple_requests_select_own"
  ON couple_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "couple_requests_insert_own"
  ON couple_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "couple_requests_update_target"
  ON couple_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = target_id)
  WITH CHECK (auth.uid() = target_id);

-- ----- Room de pareja (relación activa) -----
CREATE TABLE couple_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_couple_rooms_user1 ON couple_rooms(user1_id) WHERE active = true;
CREATE INDEX idx_couple_rooms_user2 ON couple_rooms(user2_id) WHERE active = true;

ALTER TABLE couple_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple_rooms_select_participant"
  ON couple_rooms FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "couple_rooms_update_participant"
  ON couple_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ----- Baúl de Amor (fotos + canción de pareja) -----
CREATE TABLE couple_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL UNIQUE REFERENCES couple_rooms(id) ON DELETE CASCADE,
  favorite_song_url text,
  favorite_song_title text,
  favorite_song_artist text,
  photo_1_url text,
  photo_2_url text,
  photo_3_url text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(user_id)
);

ALTER TABLE couple_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple_vault_select_participant"
  ON couple_vault FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couple_rooms
      WHERE couple_rooms.id = couple_vault.room_id
        AND (couple_rooms.user1_id = auth.uid() OR couple_rooms.user2_id = auth.uid())
    )
  );

CREATE POLICY "couple_vault_insert_participant"
  ON couple_vault FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couple_rooms
      WHERE couple_rooms.id = room_id
        AND (couple_rooms.user1_id = auth.uid() OR couple_rooms.user2_id = auth.uid())
    )
  );

CREATE POLICY "couple_vault_update_participant"
  ON couple_vault FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couple_rooms
      WHERE couple_rooms.id = couple_vault.room_id
        AND (couple_rooms.user1_id = auth.uid() OR couple_rooms.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couple_rooms
      WHERE couple_rooms.id = couple_vault.room_id
        AND (couple_rooms.user1_id = auth.uid() OR couple_rooms.user2_id = auth.uid())
    )
  );

CREATE TRIGGER set_updated_at_couple_vault
  BEFORE UPDATE ON couple_vault
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----- Diario de Amor (1 mensaje por usuario por día) -----
CREATE TABLE couple_diary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES couple_rooms(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 500),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, author_id, entry_date)
);

CREATE INDEX idx_couple_diary_room ON couple_diary(room_id, entry_date DESC);

ALTER TABLE couple_diary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple_diary_select_participant"
  ON couple_diary FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couple_rooms
      WHERE couple_rooms.id = couple_diary.room_id
        AND (couple_rooms.user1_id = auth.uid() OR couple_rooms.user2_id = auth.uid())
    )
  );

CREATE POLICY "couple_diary_insert_participant"
  ON couple_diary FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM couple_rooms
      WHERE couple_rooms.id = room_id
        AND (couple_rooms.user1_id = auth.uid() OR couple_rooms.user2_id = auth.uid())
        AND active = true
    )
  );

-- Trigger: auto-crear couple_vault al crear couple_room
CREATE OR REPLACE FUNCTION create_couple_vault()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO couple_vault (room_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_couple_room_created
  AFTER INSERT ON couple_rooms
  FOR EACH ROW EXECUTE FUNCTION create_couple_vault();

-- ============================================================================
-- 19. STORAGE BUCKETS (Supabase Storage → DO Spaces)
-- ============================================================================
-- Estos buckets se crean via Supabase Dashboard o SQL.
-- Políticas de acceso controladas aquí.

-- Bucket: profile-photos (fotos de perfil de usuarios)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880,  -- 5 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket: chismes-media (imágenes, videos, audio, documentos para chismes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chismes-media',
  'chismes-media',
  true,
  52428800,  -- 50 MB max (videos)
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Bucket: couple-vault (fotos y canciones de parejas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'couple-vault',
  'couple-vault',
  false,  -- privado: solo la pareja puede ver
  20971520,  -- 20 MB max (canciones)
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies: profile-photos
CREATE POLICY "profile_photos_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-photos');

CREATE POLICY "profile_photos_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_photos_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_photos_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies: chismes-media (solo admins pueden subir)
CREATE POLICY "chismes_media_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chismes-media');

CREATE POLICY "chismes_media_insert_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chismes-media'
    AND EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "chismes_media_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chismes-media'
    AND EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Storage policies: couple-vault (solo participantes de la pareja)
CREATE POLICY "couple_vault_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'couple-vault'
    AND EXISTS (
      SELECT 1 FROM couple_rooms
      WHERE couple_rooms.id::text = (storage.foldername(name))[1]
        AND (couple_rooms.user1_id = auth.uid() OR couple_rooms.user2_id = auth.uid())
        AND couple_rooms.active = true
    )
  );

CREATE POLICY "couple_vault_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'couple-vault'
    AND EXISTS (
      SELECT 1 FROM couple_rooms
      WHERE couple_rooms.id::text = (storage.foldername(name))[1]
        AND (couple_rooms.user1_id = auth.uid() OR couple_rooms.user2_id = auth.uid())
        AND couple_rooms.active = true
    )
  );

CREATE POLICY "couple_vault_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'couple-vault'
    AND EXISTS (
      SELECT 1 FROM couple_rooms
      WHERE couple_rooms.id::text = (storage.foldername(name))[1]
        AND (couple_rooms.user1_id = auth.uid() OR couple_rooms.user2_id = auth.uid())
    )
  );
