import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { roomService, getHostParticipantId } from '../services/roomService.js';
import { matchService } from '../services/matchService.js';
import { matchmakingService } from '../services/matchmakingService.js';
import { rankingService } from '../services/rankingService.js';
import logger from '../utils/logger.js';

const DUEL_TEXT = "The cybernetic infrastructure of the global net requires constant vigilance and precision. Every keystroke is a bit of data reclaimed from chaos. The digital frontier is not a place, but a state of mind where efficiency reigns supreme.";

interface SocketUser {
  id: string | null;
  username: string;
  isGuest: boolean;
}

interface AuthenticatedSocket extends SocketIOServer {
  user?: SocketUser;
}

export function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Matchmaking queue: userId -> socketId
  const matchmakingQueue: Map<string, string> = new Map();
  // Track online users: userId -> socketId
  const onlineUsers: Map<string, string> = new Map();
  // Authentication middleware
  io.use((socket: any, next) => {
    const token = socket.handshake.auth.token;

    if (token && token !== 'guest') {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.user = {
          id: decoded.id,
          username: decoded.username,
          isGuest: false,
        };
      } catch (error) {
        console.error('Socket auth error:', error);
        socket.user = {
          id: null,
          username: socket.handshake.auth.username || 'Guest',
          isGuest: true,
        };
      }
    } else {
      socket.user = {
        id: null,
        username: socket.handshake.auth.username || 'Guest',
        isGuest: true,
      };
    }

    next();
  });

  io.on('connection', (socket: any) => {
    logger.info(`User connected: ${socket.user.username} (${socket.id})`);

    // Room events
    socket.on('room:join', async (data: { roomCode: string }) => {
      try {
        const room = await roomService.getRoomByCode(data.roomCode);
        if (!room) {
          socket.emit('room:error', { message: 'Room not found' });
          return;
        }

        const participant = await roomService.joinRoom({
          roomId: room.id,
          userId: socket.user.isGuest ? null : socket.user.id,
          guestId: socket.user.isGuest ? socket.id : null,
          displayName: socket.user.username,
        });

        socket.join(data.roomCode);
        socket.roomCode = data.roomCode;
        socket.participantId = participant.id;

        const updatedRoom = await roomService.getRoomByCode(data.roomCode);
        io.to(data.roomCode).emit('room:update', updatedRoom);

        socket.emit('room:joined', { room: updatedRoom, participantId: participant.id });
      } catch (error: any) {
        socket.emit('room:error', { message: error.message });
      }
    });

    socket.on('room:leave', async () => {
      if (socket.roomCode && socket.participantId) {
        try {
          const roomBefore = await roomService.getRoomByCode(socket.roomCode);
          const wasHost =
            roomBefore && getHostParticipantId(roomBefore as any) === socket.participantId;
          if (roomBefore) {
            await roomService.leaveRoom(roomBefore.id, socket.participantId);
            const updatedRoom = await roomService.getRoomByCode(socket.roomCode);
            io.to(socket.roomCode).emit('room:update', updatedRoom);
            if (wasHost) {
              io.to(socket.roomCode).emit('room:host-left', { reason: 'host_left' });
            }
            if (
              updatedRoom?.status === 'in_progress' &&
              (!(updatedRoom as any).participants || (updatedRoom as any).participants.length === 0)
            ) {
              io.to(socket.roomCode).emit('room:all-disconnected', { reason: 'empty' });
            }
          }
          socket.leave(socket.roomCode);
        } catch (error) {
          console.error('Error leaving room:', error);
        }
      }
    });

    socket.on('room:ready', async (data: { isReady: boolean }) => {
      if (socket.participantId) {
        try {
          await roomService.setPlayerReady(socket.participantId, data.isReady);
          const updatedRoom = await roomService.getRoomByCode(socket.roomCode);
          io.to(socket.roomCode).emit('room:update', updatedRoom);
        } catch (error) {
          console.error('Error setting ready status:', error);
        }
      }
    });

    socket.on('room:start', async () => {
      if (socket.roomCode) {
        try {
          const room = await roomService.getRoomByCode(socket.roomCode);
          const hostPid = getHostParticipantId(room as any);
          const isHost = hostPid && socket.participantId && hostPid === socket.participantId;
          if (room && isHost) {
            // Check if all players are ready
            const participants = (room as any).participants || [];
            const allReady = participants.every((p: any) => p.is_ready);
            const minPlayers = participants.length >= 2;

            if (!allReady || !minPlayers) {
              socket.emit('room:error', { message: 'Not all players are ready or minimum players not met' });
              return;
            }

            // Create match record
            const match = await matchService.createMatch({
              roomId: room.id,
              matchType: 'race',
              textContent: room.text_content,
            });

            socket.matchId = match.id;

            await roomService.updateRoomStatus(room.id, 'in_progress');
            io.to(socket.roomCode).emit('race:countdown', { countdown: 3 });

            setTimeout(() => {
              io.to(socket.roomCode).emit('race:start', {
                text: room.text_content,
                matchId: match.id,
              });
            }, 3000);
          } else {
            socket.emit('room:error', { message: 'Only the host can start the race' });
          }
        } catch (error) {
          console.error('Error starting race:', error);
          socket.emit('room:error', { message: 'Failed to start race' });
        }
      }
    });

    socket.on('race:progress', (data: { progress: number; wpm: number; accuracy: number }) => {
      if (socket.roomCode) {
        socket.to(socket.roomCode).emit('race:player-progress', {
          participantId: socket.participantId,
          username: socket.user.username,
          ...data,
        });
      }
    });

    socket.on('race:finish', async (data: { wpm: number; accuracy: number; timeTaken: number; matchId: string }) => {
      if (socket.roomCode && socket.participantId) {
        try {
          const room = await roomService.getRoomByCode(socket.roomCode);
          if (room && data.matchId) {
            // Save individual result
            await matchService.saveResult({
              matchId: data.matchId,
              userId: socket.user.isGuest ? null : socket.user.id,
              guestId: socket.user.isGuest ? socket.id : null,
              wpm: data.wpm,
              accuracy: data.accuracy,
              timeTaken: data.timeTaken,
            });

            io.to(socket.roomCode).emit('race:player-finished', {
              participantId: socket.participantId,
              username: socket.user.username,
              ...data,
            });

            // Check if all players have finished
            const participants = (room as any).participants || [];
            const sockets = await io.in(socket.roomCode).fetchSockets();
            const finishedCount = sockets.filter((s: any) => s.hasFinished).length + 1;

            socket.hasFinished = true;

            if (finishedCount >= participants.length) {
              // All players finished, complete the match
              const { match, results } = await matchService.completeMatch(data.matchId);
              await roomService.updateRoomStatus(room.id, 'completed');

              io.to(socket.roomCode).emit('race:complete', {
                match,
                results,
              });
            }
          }
        } catch (error) {
          console.error('Error handling race finish:', error);
        }
      }
    });

    socket.on('room:chat', (data: { message: string }) => {
      if (socket.roomCode) {
        io.to(socket.roomCode).emit('room:chat', {
          username: socket.user.username,
          message: data.message,
          timestamp: new Date(),
        });
      }
    });

    // ── Online presence ──────────────────────────────────────────────────────
    if (!socket.user.isGuest && socket.user.id) {
      onlineUsers.set(socket.user.id, socket.id);
      io.emit('user:online', { userId: socket.user.id, username: socket.user.username });
    }

    // ── Duel matchmaking (ELO-based; guests use synthetic id + xp 0 so they can match real players) ──
    socket.on('duel:matchmaking', async () => {
      const userId = socket.user.isGuest ? `guest:${socket.id}` : socket.user.id!;
      const { User } = await import('../models/index.js');
      const xp = socket.user.isGuest ? 0 : (await User.findByPk(socket.user.id!, { attributes: ['xp'] }))?.xp || 0;

      matchmakingService.enqueue({ userId, username: socket.user.username, socketId: socket.id, xp, joinedAt: Date.now() });

      const opponent = matchmakingService.findOpponent(userId);

      if (opponent) {
        matchmakingService.dequeue(userId);
        matchmakingService.dequeue(opponent.userId);
        matchmakingQueue.delete(userId);
        matchmakingQueue.delete(opponent.userId);

        const duelRoomCode = `DUEL_${Date.now()}`;
        socket.join(duelRoomCode);
        io.sockets.sockets.get(opponent.socketId)?.join(duelRoomCode);

        // Fetch user data for both players
        const myUserData = socket.user.isGuest ? null : await User.findByPk(socket.user.id!, {
          attributes: ['id', 'display_name', 'profile_picture', 'avatar_id']
        });
        const opponentUserData = opponent.userId.startsWith('guest:') ? null : await User.findByPk(
          opponent.userId,
          { attributes: ['id', 'display_name', 'profile_picture', 'avatar_id'] }
        );

        const matchData = {
          roomCode: duelRoomCode,
          players: [
            {
              userId,
              username: myUserData?.display_name || socket.user.username,
              profile_picture: myUserData?.profile_picture,
              avatar_id: myUserData?.avatar_id,
            },
            {
              userId: opponent.userId,
              username: opponentUserData?.display_name || opponent.username,
              profile_picture: opponentUserData?.profile_picture,
              avatar_id: opponentUserData?.avatar_id,
            },
          ],
        };

        io.to(duelRoomCode).emit('duel:matched', matchData);
        io.to(duelRoomCode).emit('race:countdown', { countdown: 3 });
        setTimeout(() => {
          io.to(duelRoomCode).emit('duel:start', { text: DUEL_TEXT, roomCode: duelRoomCode });
        }, 3000);
      } else {
        // Legacy fallback: also add to old queue for compatibility
        matchmakingQueue.set(userId, socket.id);
        socket.emit('duel:queued', { position: matchmakingService.queueSize() });
      }
    });

    socket.on('duel:cancel', () => {
      if (socket.user.isGuest) {
        matchmakingService.dequeue(`guest:${socket.id}`);
      } else if (socket.user.id) {
        matchmakingQueue.delete(socket.user.id);
        matchmakingService.dequeue(socket.user.id);
      }
    });

    socket.on('duel:progress', (data: { progress: number; wpm: number; accuracy: number; roomCode: string }) => {
      socket.to(data.roomCode).emit('duel:opponent-progress', {
        userId: socket.user.id,
        username: socket.user.username,
        ...data,
      });
    });

    socket.on('duel:finish', async (data: { wpm: number; accuracy: number; timeTaken: number; roomCode: string }) => {
      io.to(data.roomCode).emit('duel:player-finished', {
        userId: socket.user.id,
        username: socket.user.username,
        ...data,
      });
    });

    // ── Challenge events ─────────────────────────────────────────────────────
    socket.on('challenge:send', (data: { challengedId: string }) => {
      const targetSocketId = onlineUsers.get(data.challengedId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('challenge:received', {
          challengerId: socket.user.id,
          challengerName: socket.user.username,
        });
      }
    });

    socket.on('challenge:accepted', (data: { challengerId: string; roomCode: string }) => {
      // Notify the challenger that their challenge was accepted and provide room code
      const challengerSocketId = onlineUsers.get(data.challengerId);
      if (challengerSocketId) {
        io.to(challengerSocketId).emit('challenge:accepted', {
          roomCode: data.roomCode,
          acceptedBy: socket.user.username,
        });
      }
    });

    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${socket.user.username} (${socket.id})`);

      if (socket.user.isGuest) {
        matchmakingService.dequeue(`guest:${socket.id}`);
      } else if (socket.user.id) {
        matchmakingQueue.delete(socket.user.id);
        matchmakingService.dequeue(socket.user.id);
        onlineUsers.delete(socket.user.id);
        io.emit('user:offline', { userId: socket.user.id });
      }

      if (socket.roomCode && socket.participantId) {
        try {
          const roomBefore = await roomService.getRoomByCode(socket.roomCode);
          const wasHost =
            roomBefore && getHostParticipantId(roomBefore as any) === socket.participantId;
          if (roomBefore) {
            await roomService.leaveRoom(roomBefore.id, socket.participantId);
            const updatedRoom = await roomService.getRoomByCode(socket.roomCode);
            io.to(socket.roomCode).emit('room:update', updatedRoom);
            if (wasHost) {
              io.to(socket.roomCode).emit('room:host-left', { reason: 'host_disconnected' });
            }
            if (
              updatedRoom?.status === 'in_progress' &&
              (!(updatedRoom as any).participants || (updatedRoom as any).participants.length === 0)
            ) {
              io.to(socket.roomCode).emit('room:all-disconnected', { reason: 'empty' });
            }
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });

  return io;
}
