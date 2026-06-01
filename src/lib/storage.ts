import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function saveBuffer(buffer: Buffer, ext: string): Promise<string> {
  await ensureUploadsDir();
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

export async function saveRemoteImage(url: string, prefix = "img"): Promise<string> {
  await ensureUploadsDir();
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = url.includes(".png") ? "png" : "jpg";
  const filename = `${prefix}-${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buf);
  return `/uploads/${filename}`;
}

export async function deleteFile(publicPath: string) {
  const abs = path.join(process.cwd(), "public", publicPath);
  await fs.unlink(abs).catch(() => null);
}
