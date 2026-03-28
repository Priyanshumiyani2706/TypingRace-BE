import { Request, Response } from 'express';
import { statsService } from '../services/statsService.js';

export const statsController = {
  async getGlobal(_req: Request, res: Response) {
    try {
      const stats = await statsService.getGlobalStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  async getUser(req: Request, res: Response) {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
      if (!id) {
        res.status(400).json({ error: 'Invalid user id' });
        return;
      }
      const stats = await statsService.getUserStats(id);
      res.json(stats);
    } catch (e: any) {
      res.status(e.message === 'User not found' ? 404 : 500).json({ error: e.message });
    }
  },

  async getTrends(_req: Request, res: Response) {
    try {
      const trends = await statsService.getTrends();
      res.json(trends);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
};
