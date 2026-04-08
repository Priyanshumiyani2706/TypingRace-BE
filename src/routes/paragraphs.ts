import express from 'express';
import { paragraphController } from '../controllers/paragraphController.js';

const router = express.Router();

router.get('/categories', paragraphController.categories);
router.get('/random', paragraphController.random);

export default router;

