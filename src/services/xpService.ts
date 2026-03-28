import { User } from '../models/index.js';

interface XPResult {
  xp_gained: number;
  new_total: number;
  leveled_up: boolean;
  new_level: number;
}

export const calculateXP = (wpm: number, accuracy: number, duration: number): number => {
  const base_xp = Math.round(wpm * (accuracy / 100) * (duration / 60));
  return Math.max(base_xp, 1);
};

export const calculateLevel = (xp: number): number => {
  // Simple level formula: level = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const addXPToUser = async (userId: string, xpGained: number): Promise<XPResult> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const oldXP = user.xp;
  const oldLevel = user.level;
  const newXP = oldXP + xpGained;
  const newLevel = calculateLevel(newXP);

  await user.update({
    xp: newXP,
    level: newLevel,
  });

  return {
    xp_gained: xpGained,
    new_total: newXP,
    leveled_up: newLevel > oldLevel,
    new_level: newLevel,
  };
};
