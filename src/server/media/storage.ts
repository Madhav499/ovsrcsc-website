import 'server-only';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ValidationError } from '@/lib/errors';
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  DOCUMENT_EXTENSIONS,
  IMAGE_EXTENSIONS,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
} from '@/lib/constants';

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
};

export function mediaRoot(): string {
  return path.resolve(process.env.MEDIA_ROOT ?? './storage/media');
}

export function isValidStorageKey(key: string): boolean {
  if (!key || key.length > 300) return false;
  if (key.includes('..') || key.startsWith('/') || key.includes('\\')) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(key);
}

export function resolveStoragePath(key: string): string {
  if (!isValidStorageKey(key)) {
    throw new ValidationError('Invalid media reference.');
  }
  const root = mediaRoot();
  const resolved = path.resolve(root, key);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new ValidationError('Invalid media reference.');
  }
  return resolved;
}

export async function ensureMediaRoot(): Promise<void> {
  await fs.mkdir(mediaRoot(), { recursive: true });
}

function extensionFor(originalName: string): string {
  return path.extname(originalName).toLowerCase();
}

function detectFileSignature(buffer: Buffer): 'image' | 'pdf' | 'zip' | 'ole' | 'text' | 'unknown' {
  if (buffer.length < 4) return 'unknown';
  const hex = buffer.subarray(0, 8).toString('hex').toUpperCase();
  if (hex.startsWith('FFD8FF')) return 'image';
  if (hex.startsWith('89504E47')) return 'image';
  if (hex.startsWith('47494638')) return 'image';
  if (hex.startsWith('52494646') && buffer.subarray(8, 12).toString() === 'WEBP') return 'image';
  if (buffer.subarray(0, 5).toString() === '%PDF-') return 'pdf';
  if (hex.startsWith('504B0304')) return 'zip';
  if (hex.startsWith('D0CF11E0A1B11AE1')) return 'ole';
  if (!buffer.subarray(0, 1024).includes(0)) return 'text';
  return 'unknown';
}

function assertDocumentSignature(buffer: Buffer, extension: string): void {
  const signature = detectFileSignature(buffer);
  if (extension === '.pdf' && signature !== 'pdf') {
    throw new ValidationError('The uploaded file is not a valid PDF.');
  }
  if (['.docx', '.xlsx'].includes(extension) && signature !== 'zip') {
    throw new ValidationError('The uploaded Office document appears to be invalid.');
  }
  if (['.doc', '.xls'].includes(extension) && signature !== 'ole') {
    throw new ValidationError('The uploaded Office document appears to be invalid.');
  }
  if (extension === '.txt' && signature !== 'text' && signature !== 'unknown') {
    throw new ValidationError('The uploaded text file appears to be invalid.');
  }
}

export interface StoredImage {
  key: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
  originalName: string;
}

export interface StoredDocument {
  key: string;
  width: null;
  height: null;
  sizeBytes: number;
  mimeType: string;
  originalName: string;
}

export async function storeImage(file: File): Promise<StoredImage> {
  if (file.size <= 0) throw new ValidationError('The uploaded file is empty.');
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ValidationError(`Images may not exceed ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`);
  }
  const extension = extensionFor(file.name);
  if (!(IMAGE_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new ValidationError('Unsupported image extension. Use JPG, PNG, WebP or GIF.');
  }
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new ValidationError('Unsupported image type.');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const signature = detectFileSignature(buffer);
  if (signature === 'zip' || signature === 'pdf' || signature === 'ole') {
    throw new ValidationError('The uploaded file is not a valid image.');
  }

  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const key = `${folder}/${randomUUID()}.webp`;
  const target = resolveStoragePath(key);
  await fs.mkdir(path.dirname(target), { recursive: true });

  if (extension === '.gif') {
    const metadata = await sharp(buffer, { animated: true }).metadata();
    const gifKey = `${folder}/${randomUUID()}.gif`;
    await fs.writeFile(resolveStoragePath(gifKey), buffer);
    return {
      key: gifKey,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      sizeBytes: buffer.length,
      mimeType: 'image/gif',
      originalName: file.name,
    };
  }

  let pipeline = sharp(buffer, { failOn: 'error' }).rotate();
  const metadata = await pipeline.metadata();
  if ((metadata.width ?? 0) > 2400) {
    pipeline = pipeline.resize({ width: 2400, withoutEnlargement: true });
  }
  const output = await pipeline.webp({ quality: 84, effort: 4 }).toBuffer();
  await fs.writeFile(target, output);
  const finalMetadata = await sharp(output).metadata();

  return {
    key,
    width: finalMetadata.width ?? 0,
    height: finalMetadata.height ?? 0,
    sizeBytes: output.length,
    mimeType: 'image/webp',
    originalName: file.name,
  };
}

export async function storeDocument(file: File): Promise<StoredDocument> {
  if (file.size <= 0) throw new ValidationError('The uploaded file is empty.');
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new ValidationError(
      `Documents may not exceed ${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))} MB.`,
    );
  }
  const extension = extensionFor(file.name);
  if (!(DOCUMENT_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new ValidationError('Unsupported document type. Use PDF, Word, Excel or plain text.');
  }
  if (!(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
    throw new ValidationError('Unsupported document MIME type.');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  assertDocumentSignature(buffer, extension);

  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const key = `${folder}/${randomUUID()}${MIME_TO_EXTENSION[file.type] ?? extension}`;
  const target = resolveStoragePath(key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer, { flag: 'wx' });

  return {
    key,
    width: null,
    height: null,
    sizeBytes: buffer.length,
    mimeType: file.type,
    originalName: file.name,
  };
}

export async function removeStoredFile(key: string): Promise<void> {
  try {
    await fs.unlink(resolveStoragePath(key));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
  }
}

export async function readStoredFile(key: string): Promise<Buffer> {
  return fs.readFile(resolveStoragePath(key));
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    await fs.access(resolveStoragePath(key));
    return true;
  } catch {
    return false;
  }
}
