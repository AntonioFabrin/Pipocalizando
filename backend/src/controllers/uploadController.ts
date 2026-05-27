import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// ─── Garante que a pasta uploads existe ─────────────────
const UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseStorageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'movie-posters';
const useSupabaseStorage = Boolean(supabaseUrl && supabaseServiceRoleKey);

const buildFilename = (file: Express.Multer.File) => {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(file.originalname).toLowerCase();
  return `movie-poster-${unique}${ext}`;
};

// ─── Configuração do Multer ──────────────────────────────
const storage = useSupabaseStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
      filename: (_req, file, cb) => cb(null, buildFilename(file)),
    });

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (JPEG, PNG, WEBP, GIF).'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const getSupabasePublicUrl = (objectPath: string) => {
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  return `${supabaseUrl}/storage/v1/object/public/${supabaseStorageBucket}/${encodedPath}`;
};

const uploadToSupabaseStorage = async (file: Express.Multer.File) => {
  if (!supabaseUrl || !supabaseServiceRoleKey || !file.buffer) {
    throw new Error('Supabase Storage nao configurado para upload em memoria.');
  }

  const objectPath = `movies/${buildFilename(file)}`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${supabaseStorageBucket}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': file.mimetype,
      'x-upsert': 'true',
    },
    body: file.buffer,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Falha ao enviar imagem para o Supabase Storage. ${detail}`);
  }

  return {
    filename: objectPath,
    url: getSupabasePublicUrl(objectPath),
  };
};

// ─── Controller de upload ────────────────────────────────
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    return;
  }

  if (useSupabaseStorage) {
    const uploaded = await uploadToSupabaseStorage(req.file);
    res.status(201).json({
      message: 'Upload realizado com sucesso!',
      url: uploaded.url,
      filename: uploaded.filename,
    });
    return;
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

  res.status(201).json({
    message: 'Upload realizado com sucesso!',
    url: imageUrl,
    filename: req.file.filename,
  });
};
