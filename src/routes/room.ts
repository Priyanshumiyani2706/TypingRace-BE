import express from 'express';
import { guestOrAuthMiddleware as guestOrAuth } from '../middleware/guestOrAuth.js';
import {
  createRoom,
  getRoomByCode,
  getRoomById,
  getPublicRooms,
  joinRandomRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController.js';
import { validate, schemas } from '../middleware/validate.js';

const router = express.Router();

router.post('/', guestOrAuth, validate(schemas.createRoom), createRoom);
router.get('/public', getPublicRooms);
router.get('/join-random', joinRandomRoom);
router.get('/code/:code', getRoomByCode);
router.get('/:id', getRoomById);
router.patch('/:id', guestOrAuth, updateRoom);
router.delete('/:id', guestOrAuth, deleteRoom);

export default router;
