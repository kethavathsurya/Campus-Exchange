import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function saveUploadedFile(filename: string, buffer: Buffer): Promise<string> {
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${safeName}`;
}
