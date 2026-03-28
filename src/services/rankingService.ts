import User from '../models/User.js';
import MatchResult from '../models/MatchResult.js';
import Match from '../models/Match.js';

// ELO constants
const K_FACTOR = 32;
const DEFAULT_ELO = 1200;

export const rankingService = {
  /**
   * Calculate expected score for player A against player B
   */
  expectedScore(eloA: number, eloB: number): number {
    return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  },

  /**
   * Calculate new ELO after a match
   * score: 1 = win, 0.5 = draw, 0 = loss
   */
  newElo(currentElo: number, expectedScore: number, actualScore: number): number {
    return Math.round(currentElo + K_FACTOR * (actualScore - expectedScore));
  },

  /**
   * Process ELO updates after a duel/race match
   * results: array of { userId, position } sorted by finish position
   */
  async processMatchElo(matchId: string) {
    const results = await MatchResult.findAll({
      where: { match_id: matchId },
      include: [{ model: User, as: 'user', attributes: ['id', 'xp'] }],
      order: [['position', 'ASC']],
    });

    const userResults = results.filter((r: any) => r.user_id && r.user);
    if (userResults.length < 2) return;

    // Use XP as a proxy for ELO (we store ELO in xp for now)
    // In a full implementation you'd add an elo column
    const players = userResults.map((r: any) => ({
      userId: r.user_id,
      elo: DEFAULT_ELO + (r.user?.xp || 0) / 10,
      position: r.position,
    }));

    const updates: { userId: string; delta: number }[] = [];

    // Compare each pair of players
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const a = players[i];
        const b = players[j];
        const expected = this.expectedScore(a.elo, b.elo);
        // Lower position = better rank
        const aScore = a.position < b.position ? 1 : a.position === b.position ? 0.5 : 0;
        const bScore = 1 - aScore;
        const aDelta = Math.round(K_FACTOR * (aScore - expected));
        const bDelta = Math.round(K_FACTOR * (bScore - (1 - expected)));

        const existingA = updates.find(u => u.userId === a.userId);
        const existingB = updates.find(u => u.userId === b.userId);
        if (existingA) existingA.delta += aDelta; else updates.push({ userId: a.userId, delta: aDelta });
        if (existingB) existingB.delta += bDelta; else updates.push({ userId: b.userId, delta: bDelta });
      }
    }

    // Apply XP deltas (ELO proxy)
    for (const { userId, delta } of updates) {
      const user = await User.findByPk(userId);
      if (user) {
        const newXp = Math.max(0, user.xp + delta * 10);
        await user.update({ xp: newXp });
      }
    }

    return updates;
  },

  /**
   * Get tier badge based on ELO/XP
   */
  getTier(xp: number): { tier: string; color: string; minXp: number } {
    if (xp >= 50000) return { tier: 'LEGEND', color: '#ffb2b7', minXp: 50000 };
    if (xp >= 30000) return { tier: 'MASTER', color: '#ddb7ff', minXp: 30000 };
    if (xp >= 15000) return { tier: 'DIAMOND', color: '#4cd7f6', minXp: 15000 };
    if (xp >= 7000)  return { tier: 'PLATINUM', color: '#e2e2e8', minXp: 7000 };
    if (xp >= 3000)  return { tier: 'GOLD', color: '#ffd700', minXp: 3000 };
    if (xp >= 1000)  return { tier: 'SILVER', color: '#c0c0c0', minXp: 1000 };
    return { tier: 'BRONZE', color: '#cd7f32', minXp: 0 };
  },

  async getUserRank(userId: string) {
    const user = await User.findByPk(userId, { attributes: ['id', 'xp', 'best_wpm'] });
    if (!user) throw new Error('User not found');

    const rank = await User.count({ where: { best_wpm: { $gt: user.best_wpm } as any } }) + 1;
    const tier = this.getTier(user.xp);

    return { userId, xp: user.xp, bestWpm: user.best_wpm, rank, tier };
  },
};
