-- Enable RLS on Prisma's own bookkeeping table.
--
-- `_prisma_migrations` is created by Prisma inside the `public` schema, so
-- PostgREST exposes it like any other public table. The earlier migration
-- (20260630000000_enable_rls.sql) covered the 10 application tables but not
-- this one, which is why the Supabase linter still reports
-- rls_disabled_in_public for it.
--
-- What leaks without this: the list of applied migration names and timestamps.
-- Not user data, but it maps out the schema history to anyone holding the anon
-- key — and that key ships in the browser bundle.
--
-- WHY this is safe:
--   • Prisma connects via DATABASE_URL as the postgres superuser, and the table
--     is owned by that same role. Superusers and table owners both bypass RLS
--     (there is no FORCE ROW LEVEL SECURITY here), so `prisma migrate` keeps
--     reading and writing this table normally.
--   • Nothing in the app ever queries `_prisma_migrations` through the REST API.
--
-- No policies are defined on purpose: with RLS on and zero policies, the anon
-- and authenticated roles get no rows, which is exactly the goal.
--
-- Re-runnable: enabling RLS twice is a no-op in Postgres.

ALTER TABLE IF EXISTS public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Defense in depth: PostgREST should not see this table at all. Even with RLS
-- on, dropping the role grants removes it from the exposed API surface.
REVOKE ALL ON TABLE public."_prisma_migrations" FROM anon, authenticated;
