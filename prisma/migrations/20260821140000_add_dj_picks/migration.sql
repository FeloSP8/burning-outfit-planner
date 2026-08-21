-- CreateTable
CREATE TABLE "DjPick" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DjPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DjPick_setId_idx" ON "DjPick"("setId");

-- CreateIndex
CREATE UNIQUE INDEX "DjPick_userId_setId_key" ON "DjPick"("userId", "setId");

-- AddForeignKey
ALTER TABLE "DjPick" ADD CONSTRAINT "DjPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EnableRLS
-- Misma razón que el resto de tablas: la anon key viaja en el bundle del
-- navegador, así que cualquier tabla sin RLS es legible y escribible vía
-- PostgREST. Va aquí, y no solo en supabase/migrations, para que no exista ni
-- un despliegue con la tabla desprotegida.
-- Sin políticas a propósito: todo el acceso pasa por Prisma (superusuario, que
-- salta RLS), y con RLS activo y cero políticas anon/authenticated no ven nada.
ALTER TABLE "DjPick" ENABLE ROW LEVEL SECURITY;
