import { Trophy, UserTrophy, User } from '../models/index.js';
import { Op } from 'sequelize';

interface UserStats {
  wpm?: number;
  accuracy?: number;
  streak_days?: number;
  races_won?: number;
  duels_won?: number;
  night_races?: number;
}

export const checkAndUnlockTrophies = async (
  userId: string,
  stats: UserStats
): Promise<Trophy[]> => {
  // Fetch user
  const user = await User.findByPk(userId);
  if (!user) {
    return [];
  }

  // Merge user stats with provided stats
  const fullStats = {
    wpm: stats.wpm || user.best_wpm,
    accuracy: stats.accuracy || 0,
    streak_days: user.streak_days,
    races_won: stats.races_won || 0,
    duels_won: stats.duels_won || 0,
    night_races: stats.night_races || 0,
  };

  // Fetch all trophies
  const allTrophies = await Trophy.findAll();

  // Fetch already unlocked trophy IDs
  const unlockedTrophies = await UserTrophy.findAll({
    where: { user_id: userId },
    attributes: ['trophy_id'],
  });
  const unlockedIds = new Set(unlockedTrophies.map((ut) => ut.trophy_id));

  // Check which trophies should be unlocked
  const newlyUnlocked: Trophy[] = [];

  for (const trophy of allTrophies) {
    if (unlockedIds.has(trophy.id)) {
      continue; // Already unlocked
    }

    let shouldUnlock = false;

    switch (trophy.condition_type) {
      case 'wpm':
        shouldUnlock = fullStats.wpm >= trophy.condition_value;
        break;
      case 'accuracy':
        shouldUnlock = fullStats.accuracy >= trophy.condition_value;
        break;
      case 'streak_days':
        shouldUnlock = fullStats.streak_days >= trophy.condition_value;
        break;
      case 'races_won':
        shouldUnlock = fullStats.races_won >= trophy.condition_value;
        break;
      case 'duels_won':
        shouldUnlock = fullStats.duels_won >= trophy.condition_value;
        break;
      case 'night_races':
        shouldUnlock = fullStats.night_races >= trophy.condition_value;
        break;
    }

    if (shouldUnlock) {
      try {
        await UserTrophy.create({
          user_id: userId,
          trophy_id: trophy.id,
        });
        newlyUnlocked.push(trophy);
      } catch (error) {
        // Ignore duplicate errors
      }
    }
  }

  return newlyUnlocked;
};
