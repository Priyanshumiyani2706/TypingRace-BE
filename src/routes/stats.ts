import { Router } from 'express';
import { statsController } from '../controllers/statsController.js';

const router = Router();

router.get('/global', statsController.getGlobal);
router.get('/trends', statsController.getTrends);
router.get('/user/:id', statsController.getUser);

export default router;
