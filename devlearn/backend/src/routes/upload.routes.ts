// src/routes/upload.routes.ts
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { uploadImage, uploadVideo } from '../services/cloudinary.service';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

const isAdmin = [authenticate as any, requireRole('ADMIN') as any];

router.post('/image', ...isAdmin, upload.single('file'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const url = await uploadImage(req.file.buffer, req.file.originalname);
    res.json({ url });
  } catch (err) { next(err); }
});

router.post('/video', ...isAdmin, upload.single('file'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const url = await uploadVideo(req.file.buffer, req.file.originalname);
    res.json({ url });
  } catch (err) { next(err); }
});

export default router;
