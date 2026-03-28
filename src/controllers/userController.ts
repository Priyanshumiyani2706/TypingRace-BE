import { Response } from 'express';
import { User, TestResult, Trophy, UserTrophy, Avatar, Activity } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { Op } from 'sequelize';

export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await User.findByPk(id, {
      include: [
        {
          model: Avatar,
          as: 'avatar',
        },
      ],
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      display_name: user.display_name,
      bio: user.bio,
      avatar_id: user.avatar_id,
      level: user.level,
      xp: user.xp,
      best_wpm: user.best_wpm,
      avg_wpm: user.avg_wpm,
      total_tests: user.total_tests,
      streak_days: user.streak_days,
      last_active: user.last_active,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.id !== id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { display_name, bio, avatar_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await user.update({
      display_name: display_name || user.display_name,
      bio: bio !== undefined ? bio : user.bio,
      avatar_id: avatar_id !== undefined ? avatar_id : user.avatar_id,
    });

    res.json({
      id: user.id,
      display_name: user.display_name,
      bio: user.bio,
      avatar_id: user.avatar_id,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const getTestHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const tests = await TestResult.findAll({
      where: { user_id: id },
      order: [['completed_at', 'DESC']],
      limit,
    });

    res.json(tests);
  } catch (error) {
    console.error('Get test history error:', error);
    res.status(500).json({ error: 'Failed to fetch test history' });
  }
};

export const getActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await Activity.findAll({
      where: {
        user_id: id,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['date', 'ASC']],
    });

    res.json(activities);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

export const getUserTrophies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const userTrophies = await UserTrophy.findAll({
      where: { user_id: id },
      include: [
        {
          model: Trophy,
          as: 'trophy',
        },
      ],
      order: [['unlocked_at', 'DESC']],
    });

    res.json(userTrophies);
  } catch (error) {
    console.error('Get user trophies error:', error);
    res.status(500).json({ error: 'Failed to fetch trophies' });
  }
};

export const getUserAvatars = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get all avatars unlocked at user's level or below
    const avatars = await Avatar.findAll({
      where: {
        unlock_level: {
          [Op.lte]: user.level,
        },
      },
      order: [['unlock_level', 'ASC']],
    });

    res.json(avatars);
  } catch (error) {
    console.error('Get user avatars error:', error);
    res.status(500).json({ error: 'Failed to fetch avatars' });
  }
};

export const equipAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, avatarId } = req.params;

    if (Array.isArray(id) || Array.isArray(avatarId)) {
      res.status(400).json({ error: 'Invalid parameters' });
      return;
    }

    if (!req.user || req.user.id !== id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const avatar = await Avatar.findByPk(avatarId);
    if (!avatar) {
      res.status(404).json({ error: 'Avatar not found' });
      return;
    }

    if (avatar.unlock_level > user.level) {
      res.status(403).json({ error: 'Avatar not unlocked yet' });
      return;
    }

    await user.update({ avatar_id: avatarId });

    res.json({ message: 'Avatar equipped successfully', avatar_id: avatarId });
  } catch (error) {
    console.error('Equip avatar error:', error);
    res.status(500).json({ error: 'Failed to equip avatar' });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query || query.length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' });
      return;
    }

    const users = await User.findAll({
      where: {
        display_name: { [Op.iLike]: `%${query}%` },
      },
      attributes: ['id', 'display_name', 'profile_picture', 'level'],
      limit: 10,
    });

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};
