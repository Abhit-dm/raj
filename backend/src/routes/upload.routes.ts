import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { upload } from '../middlewares/upload.middleware';

// Local file storage used when the frontend has no Cloudinary config.
// Not behind `authenticate` because the registration wizard uploads the profile photo
// before the account exists; abuse is bounded by the file filter, size cap and this limiter.
const router = Router();
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: { success: false, error: 'Too many uploads, try again later.' } });

router.post('/', uploadLimiter, (req: Request, res: Response) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      res.status(400).json({ success: false, error: message.includes('File too large') ? 'File too large (max 5 MB)' : message });
      return;
    }
    if (!req.file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; }
    res.status(201).json({ success: true, data: { url: `/uploads/${req.file.filename}`, bytes: req.file.size } });
  });
});

export default router;
