import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../db/config.js';
import User from '../models/User.js';
import TestResult from '../models/TestResult.js';
import Match from '../models/Match.js';
import MatchResult from '../models/MatchResult.js';

export const statsService = {
  async getGlobalStats() {
    const [totalUsers, totalTests, totalMatches, topWpm, avgWpmResult] = await Promise.all([
      User.count(),
      TestResult.count(),
      Match.count({ where: { completed_at: { [Op.ne]: null } } }),
      User.max('best_wpm') as Promise<number>,
      TestResult.findOne({
        attributes: [[fn('AVG', col('wpm')), 'avg_wpm']],
        raw: true,
      }),
    ]);

    const topPlayers = await User.findAll({
      attributes: ['id', 'display_name', 'profile_picture', 'best_wpm', 'level'],
      order: [['best_wpm', 'DESC']],
      limit: 5,
    });

    return {
      totalUsers,
      totalTests,
      totalMatches,
      topWpm: topWpm || 0,
      avgWpm: Math.round(Number((avgWpmResult as any)?.avg_wpm) || 0),
      topPlayers,
    };
  },

  async getUserStats(userId: string) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'display_name', 'level', 'xp', 'best_wpm', 'avg_wpm', 'total_tests', 'streak_days'],
    });
    if (!user) throw new Error('User not found');

    const [recentTests, matchResults, wpmOverTime] = await Promise.all([
      TestResult.findAll({
        where: { user_id: userId },
        order: [['completed_at', 'DESC']],
        limit: 10,
        attributes: ['wpm', 'accuracy', 'duration', 'completed_at'],
      }),
      MatchResult.findAll({
        where: { user_id: userId },
        attributes: ['wpm', 'accuracy', 'position', 'time_taken'],
        include: [{ model: Match, as: 'match', attributes: ['match_type', 'started_at'] }],
        order: [[{ model: Match, as: 'match' }, 'started_at', 'DESC']],
        limit: 20,
      }),
      TestResult.findAll({
        where: {
          user_id: userId,
          completed_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        attributes: ['wpm', 'completed_at'],
        order: [['completed_at', 'ASC']],
      }),
    ]);

    const wins = matchResults.filter((r: any) => r.position === 1).length;
    const totalRaces = matchResults.length;

    return {
      user,
      recentTests,
      matchResults,
      wpmOverTime,
      wins,
      totalRaces,
      winRate: totalRaces > 0 ? Math.round((wins / totalRaces) * 100) : 0,
    };
  },

  async getTrends() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [dailyTests, newUsers, activeUsers, topWpmThisWeek] = await Promise.all([
      // Tests per day for last 30 days
      TestResult.findAll({
        where: { completed_at: { [Op.gte]: thirtyDaysAgo } },
        attributes: [
          [fn('DATE', col('completed_at')), 'date'],
          [fn('COUNT', col('id')), 'count'],
          [fn('AVG', col('wpm')), 'avg_wpm'],
        ],
        group: [fn('DATE', col('completed_at'))],
        order: [[fn('DATE', col('completed_at')), 'ASC']],
        raw: true,
      }),
      // New users last 30 days
      User.count({ where: { created_at: { [Op.gte]: thirtyDaysAgo } } }),
      // Active users last 7 days
      User.count({ where: { last_active: { [Op.gte]: sevenDaysAgo } } }),
      // Top WPM this week
      TestResult.findOne({
        where: { completed_at: { [Op.gte]: sevenDaysAgo } },
        attributes: [[fn('MAX', col('wpm')), 'max_wpm']],
        raw: true,
      }),
    ]);

    return {
      dailyTests,
      newUsers,
      activeUsers,
      topWpmThisWeek: (topWpmThisWeek as any)?.max_wpm || 0,
    };
  },
};
