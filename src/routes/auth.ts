import { Router } from 'express';
import { googleLogin, getMe, logout, refreshToken } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

router.post('/google', validate(schemas.googleLogin), googleLogin);
router.get('/me', authMiddleware, getMe);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;
