import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import { roomService } from './roomService.js';

const DUEL_TEXT = "The cybernetic infrastructure of the global net requires constant vigilance and precision. Every keystroke is a bit of data reclaimed from chaos. The digital frontier is not a place, but a state of mind where efficiency reigns supreme.";

const userAttrs = ['id', 'display_name', 'profile_picture', 'level'];

export const challengeService = {
  async send(challengerId: string, challengedId: string) {
    const existing = await Challenge.findOne({
      where: { challenger_id: challengerId, challenged_id: challengedId, status: 'pending' },
    });
    if (existing) throw new Error('Challenge already pending');

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const challenge = await Challenge.create({
      challenger_id: challengerId,
      challenged_id: challengedId,
      status: 'pending',
      expires_at: expiresAt,
    });

    return challenge;
  },

  async accept(challengeId: string, userId: string) {
    const challenge = await Challenge.findOne({
      where: { id: challengeId, challenged_id: userId, status: 'pending' },
    });
    if (!challenge) throw new Error('Challenge not found');
    if (challenge.expires_at && new Date() > challenge.expires_at) {
      await challenge.update({ status: 'expired' });
      throw new Error('Challenge has expired');
    }

    // Auto-create a private duel room
    const room = await roomService.createRoom({
      hostUserId: challenge.challenger_id,
      roomType: 'duel',
      maxPlayers: 2,
      textContent: DUEL_TEXT,
    });

    await challenge.update({ status: 'accepted', room_id: room.id });
    return { challenge, roomCode: room.room_code };
  },

  async decline(challengeId: string, userId: string) {
    const challenge = await Challenge.findOne({
      where: { id: challengeId, challenged_id: userId, status: 'pending' },
    });
    if (!challenge) throw new Error('Challenge not found');
    await challenge.update({ status: 'declined' });
    return challenge;
  },

  async getPending(userId: string) {
    return Challenge.findAll({
      where: { challenged_id: userId, status: 'pending' },
      include: [{ model: User, as: 'challenger', attributes: userAttrs }],
      order: [['created_at', 'DESC']],
    });
  },
};
