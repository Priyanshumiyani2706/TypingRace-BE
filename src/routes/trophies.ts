import { Router } from 'express';
import { listTrophies, getTrophy } from '../controllers/trophyController.js';

const router = Router();

router.get('/', listTrophies);
router.get('/:id', getTrophy);

export default router;
