import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Storage configuration
const storage = multer.memoryStorage();

// File filter (whitelist safe types)
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents & spreadsheets
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Audio formats (voice memos, recordings, calls)
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/aac',
    'audio/flac',
    'audio/x-ms-wma',
    // Archives & Video formats (screen recordings, demo walkthroughs, video notes)
    'application/zip',
    'application/x-zip-compressed',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/3gpp',
    'video/3gpp2',
    'video/ogg',
    'video/mpeg',
    'video/x-ms-wmv',
  ];

  const mime = (file.mimetype || '').toLowerCase();
  const isAllowed =
    allowedMimeTypes.includes(mime) ||
    mime.startsWith('image/') ||
    mime.startsWith('audio/') ||
    mime.startsWith('video/');

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max size (supports videos and recordings)
  },
  fileFilter,
});
