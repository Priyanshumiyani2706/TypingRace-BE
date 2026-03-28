import { Router } from 'express';
import { saveTestResult, checkTrophies } from '../controllers/testResultController.js';
import { guestOrAuthMiddleware } from '../middleware/guestOrAuth.js';

const router = Router();

router.post('/', guestOrAuthMiddleware, saveTestResult);
router.post('/check-trophies', guestOrAuthMiddleware, checkTrophies);

export default router;
