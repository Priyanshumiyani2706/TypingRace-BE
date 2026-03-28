import { Request, Response } from 'express';
import { User } from '../models/index.js';

export const getGlobalLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const sortBy = (req.query.sort_by as string) || 'best_wpm';
    const limit = parseInt(req.query.limit as string) || 100;

    const validSortFields = ['best_wpm', 'avg_wpm', 'level', 'xp'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'best_wpm';

    const users = await User.findAll({
      where: {
        google_id: { $ne: null },
      },
      attributes: ['id', 'display_name', 'avatar_id', 'level', 'best_wpm', 'avg_wpm', 'total_tests'],
      order: [[sortField, 'DESC']],
      limit,
    });

    res.json(users);
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
