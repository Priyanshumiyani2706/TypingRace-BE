import { Request, Response } from 'express';
import { Trophy } from '../models/index.js';

export const listTrophies = async (req: Request, res: Response): Promise<void> => {
  try {
    const trophies = await Trophy.findAll({
      order: [['sort_order', 'ASC']],
    });

    res.json(trophies);
  } catch (error) {
    console.error('List trophies error:', error);
    res.status(500).json({ error: 'Failed to fetch trophies' });
  }
};

export const getTrophy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      res.status(400).json({ error: 'Invalid trophy ID' });
      return;
    }

    const trophy = await Trophy.findByPk(id);

    if (!trophy) {
      res.status(404).json({ error: 'Trophy not found' });
      return;
    }

    res.json(trophy);
  } catch (error) {
    console.error('Get trophy error:', error);
    res.status(500).json({ error: 'Failed to fetch trophy' });
  }
};
