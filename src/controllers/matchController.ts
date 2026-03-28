import { Request, Response } from 'express';
import { matchService } from '../services/matchService.js';

export const matchController = {
  async getMatchById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (Array.isArray(id)) {
        return res.status(400).json({ error: 'Invalid match ID' });
      }
      const match = await matchService.getMatchById(id);
      
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }
      
      res.json(match);
    } catch (error) {
      console.error('Error fetching match:', error);
      res.status(500).json({ error: 'Failed to fetch match' });
    }
  },

  async getUserMatchHistory(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (Array.isArray(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      const limit = parseInt(req.query.limit as string) || 10;
      
      const matches = await matchService.getUserMatchHistory(userId, limit);
      res.json(matches);
    } catch (error) {
      console.error('Error fetching match history:', error);
      res.status(500).json({ error: 'Failed to fetch match history' });
    }
  },
};
