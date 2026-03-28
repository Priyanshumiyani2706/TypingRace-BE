import { Router } from 'express';
import {
  getUser,
  updateUser,
  getTestHistory,
  getActivity,
  getUserTrophies,
  getUserAvatars,
  equipAvatar,
  searchUsers,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/search', searchUsers);
router.get('/:id', getUser);
router.patch('/:id', authMiddleware, updateUser);
router.get('/:id/test-history', getTestHistory);
router.get('/:id/activity', getActivity);
router.get('/:id/trophies', getUserTrophies);
router.get('/:id/avatars', getUserAvatars);
router.post('/:id/avatars/:avatarId/equip', authMiddleware, equipAvatar);
export default router;
