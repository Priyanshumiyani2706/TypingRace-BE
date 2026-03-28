import express from 'express';
import { matchController } from '../controllers/matchController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', matchController.getMatchById);
router.get('/user/:userId', authMiddleware, matchController.getUserMatchHistory);

export default router;
