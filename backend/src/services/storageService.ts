import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function saveUploadedFile(filename: string, buffer: Buffer): Promise<string> {
  const ext = path.extname(filename).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
  
  // Sanitize base name to prevent path traversal or unsafe characters
  const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '');
  const safeName = `${Date.now()}-${baseName || 'upload'}${safeExt}`;
  
  const filePath = path.join(UPLOAD_DIR, safeName);
  
  // Ensure destination path remains inside UPLOAD_DIR
  if (!filePath.startsWith(UPLOAD_DIR)) {
    throw new Error('Invalid file destination path');
  }

  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${safeName}`;
}
