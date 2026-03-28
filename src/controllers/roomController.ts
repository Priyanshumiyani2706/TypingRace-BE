import { Request, Response } from 'express';
import { roomService } from '../services/roomService.js';

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
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
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
