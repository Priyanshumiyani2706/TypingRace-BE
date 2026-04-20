import Match from '../models/Match.js';
import MatchResult from '../models/MatchResult.js';
import User from '../models/User.js';
import { addXPToUser, calculateXP } from './xpService.js';
import { checkAndUnlockTrophies } from './trophyService.js';

interface CreateMatchData {
  roomId: string;
  matchType: 'duel' | 'race' | 'practice';
  textContent: string;
}

interface SaveResultData {
  matchId: string;
  userId: string | null;
  guestId: string | null;
  wpm: number;
  accuracy: number;
  timeTaken: number;
}

export const matchService = {
  async createMatch(data: CreateMatchData) {
    const match = await Match.create({
      room_id: data.roomId,
      match_type: data.matchType,
      text_content: data.textContent,
      duration: 0,
      winner_id: null,
      started_at: new Date(),
      completed_at: null,
    });
    return match;
  },

  async saveResult(data: SaveResultData) {
    // Build the lookup key — unique per player per match
    const whereClause: Record<string, unknown> = { match_id: data.matchId };
    if (data.userId) {
      whereClause.user_id = data.userId;
    } else if (data.guestId) {
      whereClause.guest_id = data.guestId;
    }

    // findOrCreate ensures idempotency: re-submitting a result (e.g. on reconnect)
    // updates the existing row instead of creating a duplicate.
    const [result, created] = await MatchResult.findOrCreate({
      where: whereClause,
      defaults: {
        match_id: data.matchId,
        user_id: data.userId,
        guest_id: data.guestId,
        wpm: data.wpm,
        accuracy: data.accuracy,
        position: 0,
        time_taken: data.timeTaken,
      },
    });

    if (!created) {
      // Update with the latest values in case of a retry
      await result.update({ wpm: data.wpm, accuracy: data.accuracy, time_taken: data.timeTaken });
    }

    return result;
  },

  async completeMatch(matchId: string) {
    const results = await MatchResult.findAll({
      where: { match_id: matchId },
      order: [['time_taken', 'ASC']],
    });

    // Update positions based on time taken
    for (let i = 0; i < results.length; i++) {
      await results[i].update({ position: i + 1 });
    }

    // Determine winner (fastest time)
    const winner = results[0];
    const match = await Match.findByPk(matchId);
    
    if (match && winner) {
      const duration = Math.max(...results.map(r => r.time_taken));
      await match.update({
        winner_id: winner.user_id,
        duration,
        completed_at: new Date(),
      });

      // Award XP and check trophies for registered users
      for (const result of results) {
        if (result.user_id) {
          const xpGained = calculateXP(result.wpm, result.accuracy, result.time_taken);
          await addXPToUser(result.user_id, xpGained);
          
          // Check trophies with race stats
          await checkAndUnlockTrophies(result.user_id, {
            wpm: result.wpm,
            accuracy: result.accuracy,
            races_won: result.position === 1 ? 1 : 0,
          });
        }
      }
    }

    return { match, results };
  },

  async getActiveMatchByRoomId(roomId: string) {
    return Match.findOne({
      where: { room_id: roomId, completed_at: null },
      order: [['created_at', 'DESC']],
    });
  },

  async getMatchById(matchId: string) {
    const match = await Match.findByPk(matchId, {
      include: [
        {
          model: MatchResult,
          as: 'results',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'profile_picture'],
            },
          ],
        },
      ],
    });
    return match;
  },

  async getUserMatchHistory(userId: string, limit = 10) {
    const results = await MatchResult.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Match,
          as: 'match',
        },
      ],
      order: [['match', 'started_at', 'DESC']],
      limit,
    });
    return results;
  },
};
