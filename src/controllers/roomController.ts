import { Request, Response } from 'express';
import { roomService } from '../services/roomService.js';
import { matchService } from '../services/matchService.js';

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomType, maxPlayers, textContent } = req.body;
    const userId = req.user?.id || null;

    if (!textContent) {
      res.status(400).json({ error: 'Text content is required' });
      return;
    }

    const room = await roomService.createRoom({
      hostUserId: userId,
      roomType: roomType || 'public',
      maxPlayers: maxPlayers || 4,
      textContent,
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('[RoomController] Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

export const joinRandomRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[RoomController] joinRandomRoom called');
    const room = await roomService.findAvailablePublicRoom();
    if (!room) {
      console.log('[RoomController] No available room found for joinRandom');
      res.status(404).json({ error: 'No available rooms' });
      return;
    }
    console.log(`[RoomController] Sending available room back: ${room.room_code}`);
    res.json(room);
  } catch (error) {
    console.error('[RoomController] Error in joinRandomRoom:', error);
    res.status(500).json({ error: 'Failed to find a room' });
  }
};

export const getRoomByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    if (Array.isArray(code)) {
      res.status(400).json({ error: 'Invalid room code' });
      return;
    }

    const room = await roomService.getRoomByCode(code);

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
};

/** Latest in-progress match for a room (for clients that navigated after `race:start` was emitted). */
export const getActiveMatchForRoomCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    if (Array.isArray(code)) {
      res.status(400).json({ error: 'Invalid room code' });
      return;
    }
    const room = await roomService.getRoomByCode(code);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    const status = room.get?.('status') ?? (room as { status?: string }).status;
    if (status !== 'in_progress') {
      res.json({ match: null });
      return;
    }
    const roomId = room.get?.('id') ?? (room as { id: string }).id;
    const match = await matchService.getActiveMatchByRoomId(roomId);
    if (!match) {
      res.json({ match: null });
      return;
    }
    res.json({
      match: {
        id: match.id,
        text_content: match.text_content,
        room_id: roomId,
      },
    });
  } catch (error) {
    console.error('Error fetching active match:', error);
    res.status(500).json({ error: 'Failed to fetch active match' });
  }
};

export const getRoomById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      res.status(400).json({ error: 'Invalid room ID' });
      return;
    }

    const room = await roomService.getRoomById(id);

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
};

export const getPublicRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await roomService.getPublicRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching public rooms:', error);
    res.status(500).json({ error: 'Failed to fetch public rooms' });
  }
};

export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (Array.isArray(id)) {
      res.status(400).json({ error: 'Invalid room ID' });
      return;
    }

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const room = await roomService.updateRoomStatus(id, status);
    res.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      res.status(400).json({ error: 'Invalid room ID' });
      return;
    }

    await roomService.deleteRoom(id);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
};
