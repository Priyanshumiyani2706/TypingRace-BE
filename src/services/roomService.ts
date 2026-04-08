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
  // Avoid O(n log n) sort: we only need the earliest participant.
  let bestId: string | null = null;
  let bestTime = Number.POSITIVE_INFINITY;
  for (const p of participants) {
    const t = new Date(p.joined_at).getTime();
    if (t < bestTime) {
      bestTime = t;
      bestId = p.id ?? null;
    }
  }
  return bestId;
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
    const normalizedCode = roomCode.toUpperCase();
    console.log(`[RoomService] Fetching room by code: ${normalizedCode} (original: ${roomCode})`);
    const room = await Room.findOne({
      where: { room_code: normalizedCode },
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

    if (room) {
      console.log(`[RoomService] Found room ${normalizedCode}. ID: ${room.get('id')}, Status: ${room.get('status')}`);
    } else {
      console.log(`[RoomService] Room ${normalizedCode} NOT found in DB.`);
    }

    return room;
  },

  async getRoomById(roomId: string) {
    console.log(`[RoomService] Fetching room by ID: ${roomId}`);
    if (!roomId) {
      console.error('[RoomService] getRoomById called with undefined/null roomId!');
      return null;
    }
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
      console.error(`[RoomService] joinRoom failed: Room not found for ID ${roomId}`);
      throw new Error('Room not found');
    }

    const roomStatus = room.get('status');
    const roomMaxPlayers = room.get('max_players');

    console.log(`[RoomService] joinRoom: Room found. Status: ${roomStatus}, Max Players: ${roomMaxPlayers}`);

    // ── Idempotency guard: return existing participant if already in room ──
    // This handles the case where a user navigates between lobby and race track
    // causing useRoom to emit room:join multiple times for the same session.
    const existingWhereClause: Record<string, unknown> = { room_id: roomId, left_at: null };
    if (userId) {
      existingWhereClause.user_id = userId;
    } else if (guestId) {
      existingWhereClause.guest_id = guestId;
    }
    const existingParticipant = await RoomParticipant.findOne({ where: existingWhereClause });
    if (existingParticipant) {
      console.log(`[RoomService] joinRoom: Participant already exists (ID: ${existingParticipant.id}). Returning existing record.`);
      const id = existingParticipant.get ? existingParticipant.get('id') : existingParticipant.id || (existingParticipant as any).dataValues?.id;
      return { participant: existingParticipant, participantId: id };
    }

    // Room is in progress but user wasn't previously in it — block entry
    if (roomStatus !== 'waiting') {
      console.error(`[RoomService] joinRoom failed: Room status is ${roomStatus}`);
      throw new Error('Room is not accepting new players');
    }

    const participantCount = await RoomParticipant.count({ where: { room_id: roomId, left_at: null } });
    if (participantCount >= roomMaxPlayers) {
      console.error(`[RoomService] joinRoom failed: Room is full (${participantCount}/${roomMaxPlayers})`);
      throw new Error('Room is full');
    }

    console.log(`[RoomService] joinRoom: Creating participant for Room: ${roomId}, DisplayName: ${displayName}`);

    const participant = await RoomParticipant.create({
      room_id: roomId,
      user_id: userId,
      guest_id: guestId,
      display_name: displayName || 'Guest',
      is_ready: false,
    });

    console.log(`[RoomService] joinRoom: Participant object keys: `, Object.keys(participant));
    console.log(`[RoomService] joinRoom: Participant toJSON: `, typeof participant.toJSON === 'function' ? participant.toJSON() : 'No toJSON method');

    let participantId;
    if (participant.get) {
      participantId = participant.get('id');
    } else if (participant.id !== undefined) {
      participantId = participant.id;
    } else {
      participantId = (participant as any).dataValues?.id;
    }

    if (!participantId) {
      console.warn(`[RoomService] joinRoom: Participant ID undefined after create, reloading instance...`);
      await participant.reload();
      participantId = participant.get('id');
    }

    console.log(`[RoomService] joinRoom: Participant created successfully. ID: ${participantId}`);

    return { participant, participantId };
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
    console.log('[RoomService] Fetching all public waiting rooms');
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

  async findAvailablePublicRoom() {
    console.log('[RoomService] Searching for available public room...');
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
    });

    // Find first room that isn't full
    const availableRoom = rooms.find((r: any) => (r.participants?.length || 0) < r.max_players);
    
    if (availableRoom) {
      console.log(`[RoomService] Found available room: ${availableRoom.room_code}`);
    } else {
      console.log('[RoomService] No available public rooms found.');
    }

    return availableRoom;
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
