import { Router } from 'express';
import { getGlobalLeaderboard } from '../controllers/leaderboardController.js';

const router = Router();

router.get('/global', getGlobalLeaderboard);

export default router;
