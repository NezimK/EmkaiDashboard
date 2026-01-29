-- =============================================================================
-- EMKAI DASHBOARD - POLITIQUES RLS (Row Level Security) SUPABASE
-- =============================================================================
-- IMPORTANT: Exécuter ce script dans Supabase SQL Editor
-- Ces politiques garantissent l'isolation des données entre tenants
-- =============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE biens ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- OPTION 1: POLITIQUES BASÉES SUR app.current_tenant_id
-- Utiliser si vous définissez le tenant_id via une fonction RPC avant chaque requête
-- =============================================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "leads_select_own_tenant" ON leads;
DROP POLICY IF EXISTS "leads_insert_own_tenant" ON leads;
DROP POLICY IF EXISTS "leads_update_own_tenant" ON leads;
DROP POLICY IF EXISTS "leads_delete_own_tenant" ON leads;

DROP POLICY IF EXISTS "biens_select_own_tenant" ON biens;
DROP POLICY IF EXISTS "biens_insert_own_tenant" ON biens;
DROP POLICY IF EXISTS "biens_update_own_tenant" ON biens;
DROP POLICY IF EXISTS "biens_delete_own_tenant" ON biens;

-- LEADS: Politiques multi-tenant
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

-- BIENS: Politiques multi-tenant
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

-- =============================================================================
-- FONCTION HELPER: Définir le tenant_id courant
-- Appeler cette fonction au début de chaque session/requête côté backend
-- =============================================================================

CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION set_current_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_tenant(uuid) TO anon;

-- =============================================================================
-- OPTION 2 (ALTERNATIVE): POLITIQUES BASÉES SUR JWT CLAIMS
-- Utiliser si vous passez le tenant_id dans le JWT via app_metadata
-- Décommenter les lignes ci-dessous si vous préférez cette approche
-- =============================================================================

/*
-- Supprimer les politiques existantes d'abord
DROP POLICY IF EXISTS "leads_select_jwt" ON leads;
DROP POLICY IF EXISTS "leads_insert_jwt" ON leads;
DROP POLICY IF EXISTS "leads_update_jwt" ON leads;
DROP POLICY IF EXISTS "leads_delete_jwt" ON leads;

DROP POLICY IF EXISTS "biens_select_jwt" ON biens;
DROP POLICY IF EXISTS "biens_insert_jwt" ON biens;
DROP POLICY IF EXISTS "biens_update_jwt" ON biens;
DROP POLICY IF EXISTS "biens_delete_jwt" ON biens;

-- LEADS avec JWT claims
CREATE POLICY "leads_select_jwt" ON leads
  FOR SELECT
  USING (client_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "leads_insert_jwt" ON leads
  FOR INSERT
  WITH CHECK (client_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "leads_update_jwt" ON leads
  FOR UPDATE
  USING (client_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "leads_delete_jwt" ON leads
  FOR DELETE
  USING (client_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- BIENS avec JWT claims
CREATE POLICY "biens_select_jwt" ON biens
  FOR SELECT
  USING (client_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "biens_insert_jwt" ON biens
  FOR INSERT
  WITH CHECK (client_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "biens_update_jwt" ON biens
  FOR UPDATE
  USING (client_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "biens_delete_jwt" ON biens
  FOR DELETE
  USING (client_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
*/

-- =============================================================================
-- OPTION 3 (RECOMMANDÉE POUR VOTRE CAS): ACCÈS PUBLIC AVEC FILTRAGE APPLICATION
-- Comme vous n'utilisez pas Supabase Auth, cette option permet un accès
-- mais EXIGE que l'application filtre TOUJOURS par client_id
-- =============================================================================

/*
-- Créer des politiques qui permettent l'accès via anon key
-- ATTENTION: Cela repose sur le filtrage côté application
-- Moins sécurisé mais compatible avec votre architecture actuelle

DROP POLICY IF EXISTS "leads_public_access" ON leads;
DROP POLICY IF EXISTS "biens_public_access" ON biens;

CREATE POLICY "leads_public_access" ON leads FOR ALL USING (true);
CREATE POLICY "biens_public_access" ON biens FOR ALL USING (true);
*/

-- =============================================================================
-- VÉRIFICATION: Lister les politiques actives
-- =============================================================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('leads', 'biens')
ORDER BY tablename, policyname;

-- =============================================================================
-- TEST: Vérifier que RLS est bien activé
-- =============================================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('leads', 'biens');
