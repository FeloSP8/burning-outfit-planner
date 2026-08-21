-- Enable Row-Level Security on the DjPick table.
--
-- La migración de Prisma que crea la tabla (20260821140000_add_dj_picks) ya
-- ejecuta este mismo ALTER. Este fichero se mantiene por convención del repo
-- (ruta del Supabase CLI) y es un no-op si aquella ya se aplicó.
--
-- Same reasoning as 20260630000000_enable_rls.sql: the anon key ships in the
-- browser bundle, so any public table is reachable through PostgREST
-- (/rest/v1/) unless RLS is on.
--
-- No policies on purpose: all access goes through Prisma (postgres superuser,
-- bypasses RLS), and with RLS on plus zero policies the anon and authenticated
-- roles get no rows at all.
--
-- Re-runnable: enabling RLS twice is a no-op in Postgres.

ALTER TABLE IF EXISTS public."DjPick" ENABLE ROW LEVEL SECURITY;
