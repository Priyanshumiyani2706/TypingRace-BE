import { Response } from 'express';
import { TestResult, User, Activity } from '../models/index.js';
import { GuestOrAuthRequest } from '../middleware/guestOrAuth.js';
import { checkAndUnlockTrophies } from '../services/trophyService.js';
import { calculateXP, addXPToUser } from '../services/xpService.js';
import { updateStreak } from '../services/streakService.js';
import { Op } from 'sequelize';

export const saveTestResult = async (req: GuestOrAuthRequest, res: Response): Promise<void> => {
  try {
    const { wpm, accuracy, duration, language, typed_text } = req.body;

    if (!wpm || !accuracy || !duration || !typed_text) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const identity = req.identity;
    if (!identity) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Create test result
    const testResult = await TestResult.create({
      user_id: identity.type === 'user' ? identity.id : undefined,
      anon_id: identity.type === 'guest' ? identity.id : undefined,
      wpm,
      accuracy,
      duration,
      language: language || 'en',
      typed_text,
    });

    // Update user stats if authenticated
    if (identity.type === 'user') {
      const user = await User.findByPk(identity.id);
      if (user) {
        // Update best WPM
        if (wpm > user.best_wpm) {
          await user.update({ best_wpm: wpm });
        }

        // Update average WPM
        const totalTests = user.total_tests + 1;
        const newAvgWpm = ((user.avg_wpm * user.total_tests) + wpm) / totalTests;
        await user.update({
          avg_wpm: newAvgWpm,
          total_tests: totalTests,
        });

        // Update streak
        const newStreak = await updateStreak(identity.id);

        // Calculate and add XP
        const xpGained = calculateXP(wpm, accuracy, duration);
        const xpResult = await addXPToUser(identity.id, xpGained);

        // Update activity
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [activity] = await Activity.findOrCreate({
          where: {
            user_id: identity.id,
            date: today,
          },
          defaults: {
            user_id: identity.id,
            date: today,
            test_count: 0,
          },
        });

        await activity.increment('test_count');

        // Check for trophy unlocks
        const newTrophies = await checkAndUnlockTrophies(identity.id, { wpm, accuracy });

        res.json({
          test_result: testResult,
          xp: xpResult,
          streak: newStreak,
          new_trophies: newTrophies,
        });
        return;
      }
    }

    res.json({ test_result: testResult });
  } catch (error) {
    console.error('Save test result error:', error);
    res.status(500).json({ error: 'Failed to save test result' });
  }
};

export const checkTrophies = async (req: GuestOrAuthRequest, res: Response): Promise<void> => {
  try {
    const identity = req.identity;
    if (!identity || identity.type !== 'user') {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await User.findByPk(identity.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const newTrophies = await checkAndUnlockTrophies(identity.id, {
      wpm: user.best_wpm,
      streak_days: user.streak_days,
    });

    res.json({ new_trophies: newTrophies });
  } catch (error) {
    console.error('Check trophies error:', error);
    res.status(500).json({ error: 'Failed to check trophies' });
  }
};
