import express from 'express';
import { challengeController } from '../controllers/challengeController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/', validate(schemas.sendChallenge), challengeController.send);
router.get('/', challengeController.getPending);
router.patch('/:id/accept', challengeController.accept);
router.patch('/:id/decline', challengeController.decline);

export default router;
