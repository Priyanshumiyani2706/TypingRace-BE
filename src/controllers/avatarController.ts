import { Request, Response } from 'express';
import { Avatar } from '../models/index.js';

export const listAvatars = async (req: Request, res: Response): Promise<void> => {
  try {
    const avatars = await Avatar.findAll({
      order: [['unlock_level', 'ASC']],
    });

    res.json(avatars);
  } catch (error) {
    console.error('List avatars error:', error);
    res.status(500).json({ error: 'Failed to fetch avatars' });
  }
};

export const getAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      res.status(400).json({ error: 'Invalid avatar ID' });
      return;
    }

    const avatar = await Avatar.findByPk(id);

    if (!avatar) {
      res.status(404).json({ error: 'Avatar not found' });
      return;
    }

    res.json(avatar);
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ error: 'Failed to fetch avatar' });
  }
};
