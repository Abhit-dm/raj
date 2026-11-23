import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const ctrl = new AuthController();

// Phone + OTP sign-in / sign-up (drivers and fleet owners)
router.post('/otp/send', ctrl.sendOtp);
router.post('/otp/verify', ctrl.verifyOtp);
router.post('/signup', ctrl.signup);

router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.put('/me/language', authenticate, ctrl.setLanguage);

export default router;
