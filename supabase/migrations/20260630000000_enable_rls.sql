-- Enable Row-Level Security on all application tables.
--
-- WHY this is safe:
--   • Prisma connects via DATABASE_URL as the postgres superuser → superusers
--     always bypass RLS, so all server-side queries continue to work.
--   • The Supabase admin client uses service_role → also bypasses RLS.
--   • The public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is embedded in the
--     browser bundle. Without RLS anyone could use it to hit the REST API
--     (/rest/v1/) and read or mutate every row. Enabling RLS blocks that.
--
-- No explicit policies are needed because:
--   • All data access goes through Prisma (server-side, superuser).
--   • The Supabase JS client is only used for Auth, never for table queries.
--   • Blocking the anon and authenticated roles from the REST API is the
--     intended behavior.

ALTER TABLE "User"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Day"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shift"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Outfit"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OutfitItem"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Garment"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TryOnResult"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reaction"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChecklistItem"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChecklistCheck" ENABLE ROW LEVEL SECURITY;
