-- Añade el campo origin a ChecklistItem para agrupar por dónde comprar.
-- Valores: "ESPANA" (traer de España), "ALLI" (comprar allí: Costco/Home Depot), NULL (sin clasificar).
ALTER TABLE "ChecklistItem" ADD COLUMN IF NOT EXISTS "origin" TEXT;
