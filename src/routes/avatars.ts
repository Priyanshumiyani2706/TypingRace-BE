import { Router } from 'express';
import { listAvatars, getAvatar } from '../controllers/avatarController.js';

const router = Router();

router.get('/', listAvatars);
router.get('/:id', getAvatar);

export default router;
