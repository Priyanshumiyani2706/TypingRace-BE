import { Room, RoomParticipant, User } from '../models/index.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';

interface CreateRoomParams {
  hostUserId: string | null;
  roomType: 'public' | 'private' | 'duel';
  maxPlayers: number;
  textContent: string;
}

interface JoinRoomParams {
  roomId: string;
  userId: string | null;
  guestId: string | null;
  displayName: string;
}

/** Host = user matching host_user_id, or first joined participant when host is a guest (no user id). */
export function getHostParticipantId(room: any): string | null {
  const participants = (room?.participants || []).filter((p: any) => !p.left_at);
  if (!participants.length) return null;
  if (room.host_user_id) {
    const p = participants.find((x: any) => x.user_id === room.host_user_id);
    return p?.id ?? null;
  }
  const sorted = [...participants].sort(
    (a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
  );
  return sorted[0]?.id ?? null;
}

export const roomService = {
  async createRoom(params: CreateRoomParams) {
    const { hostUserId, roomType, maxPlayers, textContent } = params;

    // Generate unique room code
    let roomCode = generateRoomCode();
    let existingRoom = await Room.findOne({ where: { room_code: roomCode } });

    while (existingRoom) {
      roomCode = generateRoomCode();
      existingRoom = await Room.findOne({ where: { room_code: roomCode } });
    }

    const room = await Room.create({
      room_code: roomCode,
      host_user_id: hostUserId,
      room_type: roomType,
      max_players: maxPlayers,
      status: 'waiting',
      text_content: textContent,
    });

    return room;
  },

  async getRoomByCode(roomCode: string) {
    const room = await Room.findOne({
      where: { room_code: roomCode },
      include: [
        {
          model: RoomParticipant,
          as: 'participants',
          where: { left_at: null },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'display_name', 'profile_picture', 'avatar_id', 'level', 'best_wpm', 'avg_wpm'],
            },
          ],
        },
      ],
    });

    return room;
  },

  async getRoomById(roomId: string) {
    const room = await Room.findByPk(roomId, {
      include: [
        {
          model: RoomParticipant,
          as: 'participants',
          where: { left_at: null },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'display_name', 'profile_picture', 'avatar_id', 'level', 'best_wpm', 'avg_wpm'],
            },
          ],
        },
      ],
    });

    return room;
  },

  async joinRoom(params: JoinRoomParams) {
    const { roomId, userId, guestId, displayName } = params;

    const room = await this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'waiting') {
      throw new Error('Room is not accepting new players');
    }

    const participantCount = await RoomParticipant.count({ where: { room_id: roomId, left_at: null } });
    if (participantCount >= room.max_players) {
      throw new Error('Room is full');
    }

    const participant = await RoomParticipant.create({
      room_id: roomId,
      user_id: userId,
      guest_id: guestId,
      display_name: displayName,
      is_ready: false,
    });

    return participant;
  },

  async leaveRoom(roomId: string, participantId: string) {
    const participant = await RoomParticipant.findOne({
      where: { id: participantId, room_id: roomId },
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    participant.left_at = new Date();
    await participant.save();

    return participant;
  },

  async setPlayerReady(participantId: string, isReady: boolean) {
    const participant = await RoomParticipant.findByPk(participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    participant.is_ready = isReady;
    await participant.save();

    return participant;
  },

  async updateRoomStatus(roomId: string, status: 'waiting' | 'in_progress' | 'completed') {
    const room = await Room.findByPk(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    room.status = status;
    await room.save();

    return room;
  },

  async getPublicRooms() {
    const rooms = await Room.findAll({
      where: {
        room_type: 'public',
        status: 'waiting',
      },
      include: [
        {
          model: RoomParticipant,
          as: 'participants',
          where: { left_at: null },
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    return rooms;
  },

  async deleteRoom(roomId: string) {
    const room = await Room.findByPk(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    await room.destroy();
    return true;
  },
};
