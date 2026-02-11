-- =============================================================================
-- EMKAI DASHBOARD - POLITIQUES RLS (Row Level Security) SUPABASE
-- =============================================================================
-- IMPORTANT: Exécuter ce script dans Supabase SQL Editor
-- Ces politiques garantissent l'isolation des données entre tenants
-- =============================================================================

-- =============================================================================
-- ÉTAPE 1: Activer RLS sur toutes les tables sensibles
-- =============================================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE biens ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_numbers_pool ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 2: Fonction helper pour définir le tenant courant
-- =============================================================================

CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_current_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_tenant(uuid) TO anon;

-- =============================================================================
-- ÉTAPE 3: Politiques RLS par table
-- Basées sur app.current_tenant_id (défini via set_current_tenant())
-- NOTE: La Service Role Key bypass toutes ces politiques
-- =============================================================================

-- -----------------------------------------------------------------------------
-- LEADS (isolation par client_id)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "leads_select_own_tenant" ON leads;
DROP POLICY IF EXISTS "leads_insert_own_tenant" ON leads;
DROP POLICY IF EXISTS "leads_update_own_tenant" ON leads;
DROP POLICY IF EXISTS "leads_delete_own_tenant" ON leads;

CREATE POLICY "leads_select_own_tenant" ON leads
  FOR SELECT
  USING (client_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "leads_insert_own_tenant" ON leads
  FOR INSERT
  WITH CHECK (client_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "leads_update_own_tenant" ON leads
  FOR UPDATE
  USING (client_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "leads_delete_own_tenant" ON leads
  FOR DELETE
  USING (client_id = current_setting('app.current_tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- BIENS (isolation par client_id)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "biens_select_own_tenant" ON biens;
DROP POLICY IF EXISTS "biens_insert_own_tenant" ON biens;
DROP POLICY IF EXISTS "biens_update_own_tenant" ON biens;
DROP POLICY IF EXISTS "biens_delete_own_tenant" ON biens;

CREATE POLICY "biens_select_own_tenant" ON biens
  FOR SELECT
  USING (client_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "biens_insert_own_tenant" ON biens
  FOR INSERT
  WITH CHECK (client_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "biens_update_own_tenant" ON biens
  FOR UPDATE
  USING (client_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "biens_delete_own_tenant" ON biens
  FOR DELETE
  USING (client_id = current_setting('app.current_tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- TENANTS (un tenant ne voit que sa propre ligne)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "tenants_select_own" ON tenants;
DROP POLICY IF EXISTS "tenants_update_own" ON tenants;

CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "tenants_update_own" ON tenants
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Pas de INSERT/DELETE : seul le backend (service role) crée/supprime des tenants

-- -----------------------------------------------------------------------------
-- USERS (isolation par tenant_id)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_select_own_tenant" ON users;
DROP POLICY IF EXISTS "users_insert_own_tenant" ON users;
DROP POLICY IF EXISTS "users_update_own_tenant" ON users;
DROP POLICY IF EXISTS "users_delete_own_tenant" ON users;

CREATE POLICY "users_select_own_tenant" ON users
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "users_insert_own_tenant" ON users
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "users_update_own_tenant" ON users
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "users_delete_own_tenant" ON users
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- CALENDAR_TOKENS (isolation indirecte via user_id → users.tenant_id)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "calendar_tokens_select_own_tenant" ON calendar_tokens;
DROP POLICY IF EXISTS "calendar_tokens_insert_own_tenant" ON calendar_tokens;
DROP POLICY IF EXISTS "calendar_tokens_update_own_tenant" ON calendar_tokens;
DROP POLICY IF EXISTS "calendar_tokens_delete_own_tenant" ON calendar_tokens;

CREATE POLICY "calendar_tokens_select_own_tenant" ON calendar_tokens
  FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

CREATE POLICY "calendar_tokens_insert_own_tenant" ON calendar_tokens
  FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

CREATE POLICY "calendar_tokens_update_own_tenant" ON calendar_tokens
  FOR UPDATE
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

CREATE POLICY "calendar_tokens_delete_own_tenant" ON calendar_tokens
  FOR DELETE
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

-- -----------------------------------------------------------------------------
-- MAGIC_LINKS (isolation indirecte via user_id → users.tenant_id)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "magic_links_select_own_tenant" ON magic_links;
DROP POLICY IF EXISTS "magic_links_insert_own_tenant" ON magic_links;
DROP POLICY IF EXISTS "magic_links_update_own_tenant" ON magic_links;
DROP POLICY IF EXISTS "magic_links_delete_own_tenant" ON magic_links;

CREATE POLICY "magic_links_select_own_tenant" ON magic_links
  FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

CREATE POLICY "magic_links_insert_own_tenant" ON magic_links
  FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

CREATE POLICY "magic_links_update_own_tenant" ON magic_links
  FOR UPDATE
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

CREATE POLICY "magic_links_delete_own_tenant" ON magic_links
  FOR DELETE
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

-- -----------------------------------------------------------------------------
-- REFRESH_TOKENS (isolation indirecte via user_id → users.tenant_id)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "refresh_tokens_select_own_tenant" ON refresh_tokens;
DROP POLICY IF EXISTS "refresh_tokens_insert_own_tenant" ON refresh_tokens;
DROP POLICY IF EXISTS "refresh_tokens_update_own_tenant" ON refresh_tokens;
DROP POLICY IF EXISTS "refresh_tokens_delete_own_tenant" ON refresh_tokens;

CREATE POLICY "refresh_tokens_select_own_tenant" ON refresh_tokens
  FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

CREATE POLICY "refresh_tokens_insert_own_tenant" ON refresh_tokens
  FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

CREATE POLICY "refresh_tokens_update_own_tenant" ON refresh_tokens
  FOR UPDATE
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

CREATE POLICY "refresh_tokens_delete_own_tenant" ON refresh_tokens
  FOR DELETE
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
  ));

-- -----------------------------------------------------------------------------
-- WHATSAPP_NUMBERS_POOL (isolation par tenant_id)
-- Un tenant ne voit que ses numéros assignés
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "whatsapp_pool_select_own_tenant" ON whatsapp_numbers_pool;
DROP POLICY IF EXISTS "whatsapp_pool_update_own_tenant" ON whatsapp_numbers_pool;

CREATE POLICY "whatsapp_pool_select_own_tenant" ON whatsapp_numbers_pool
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "whatsapp_pool_update_own_tenant" ON whatsapp_numbers_pool
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Pas de INSERT/DELETE : seul le backend (service role) gère le pool

-- =============================================================================
-- VÉRIFICATION: Lister toutes les politiques actives
-- =============================================================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN (
  'leads', 'biens', 'tenants', 'users',
  'calendar_tokens', 'magic_links', 'refresh_tokens', 'whatsapp_numbers_pool'
)
ORDER BY tablename, policyname;

-- =============================================================================
-- VÉRIFICATION: Confirmer que RLS est activé sur toutes les tables
-- =============================================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'leads', 'biens', 'tenants', 'users',
    'calendar_tokens', 'magic_links', 'refresh_tokens', 'whatsapp_numbers_pool'
  )
ORDER BY tablename;
