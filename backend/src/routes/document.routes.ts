import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();
const ctrl = new DocumentController();

router.use(authenticate);
router.post('/upload', upload.single('document'), ctrl.upload);
router.post('/save-url', ctrl.saveUrl);
router.get('/me', ctrl.getMyDocuments);
router.delete('/:id', ctrl.delete);
router.post('/:id/resubmit', upload.single('document'), ctrl.resubmit);

export default router;
