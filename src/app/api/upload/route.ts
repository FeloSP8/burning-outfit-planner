import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveBuffer } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "El archivo supera 5 MB" }, { status: 400 });

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const buf = Buffer.from(await file.arrayBuffer());
  const url = await saveBuffer(user.id, buf, ext);

  return NextResponse.json({ url });
}
