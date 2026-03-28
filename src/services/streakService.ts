import { User } from '../models/index.js';

export const updateStreak = async (userId: string): Promise<number> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!user.last_active) {
    // First activity
    await user.update({
      streak_days: 1,
      last_active: now,
    });
    return 1;
  }

  const lastActive = new Date(user.last_active);
  const lastActiveDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  
  const daysDiff = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

  let newStreak = user.streak_days;

  if (daysDiff === 0) {
    // Same day, no change
    newStreak = user.streak_days;
  } else if (daysDiff === 1) {
    // Yesterday, increment streak
    newStreak = user.streak_days + 1;
  } else {
    // 2+ days ago, reset streak
    newStreak = 1;
  }

  await user.update({
    streak_days: newStreak,
    last_active: now,
  });

  return newStreak;
};
