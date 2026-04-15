import { Server as SocketIOServer, type Socket } from 'socket.io';
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
  guestId?: string | null;
}

type ServerToClientEvents = Record<string, (...args: any[]) => void>;
type ClientToServerEvents = Record<string, (...args: any[]) => void>;

type AuthedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  user: SocketUser;
  roomCode?: string;
  participantId?: string;
  matchId?: string;
  isDuelRoom?: boolean;
};

interface DuelSessionState {
  roomCode: string;
  matchId: string;
  text: string;
  startedAt?: string;
}

interface DuelParticipantState {
  playerId: string;
  username: string;
  socketId: string;
  userId: string | null;
  guestId: string | null;
}

interface DuelProgressState {
  progress: number;
  wpm: number;
  accuracy: number;
  timeTaken?: number;
}

let modelsPromise:
  | Promise<{ User: any; Match: any; MatchResult: any }>
  | null = null;
const getModels = async () => {
  modelsPromise ??= import('../models/index.js').then((m) => ({
    User: (m as any).User,
    Match: (m as any).Match,
    MatchResult: (m as any).MatchResult,
  }));
  return modelsPromise;
};

const getGuestIdentity = (socket: AuthedSocket) => socket.user.guestId || socket.id;
const getSocketPlayerId = (socket: AuthedSocket) =>
  socket.user.isGuest ? `guest:${getGuestIdentity(socket)}` : socket.user.id!;

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
  // Track duel start timestamps so refreshed clients can restore the real timer.
  const duelSessions: Map<string, DuelSessionState> = new Map();
  const duelParticipants: Map<string, DuelParticipantState[]> = new Map();
  const duelProgress: Map<string, Map<string, DuelProgressState>> = new Map();
  const duelForfeitedPlayers: Map<string, Set<string>> = new Map();
  // Authentication middleware
  io.use((socket, next) => {
    const s = socket as AuthedSocket;
    const token = s.handshake.auth?.token;
    const fallbackUsername = s.handshake.auth?.username || 'Guest';
    const guestId = s.handshake.auth?.guestId || null;

    if (token && token !== 'guest') {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        s.user = {
          id: decoded.id,
          username: decoded.display_name || decoded.username || 'User',
          isGuest: false,
          guestId: null,
        };
      } catch (error) {
        logger.warn('Socket auth error; falling back to guest', { error });
        s.user = {
          id: null,
          username: fallbackUsername,
          isGuest: true,
          guestId: guestId,
        };
      }
    } else {
      s.user = {
        id: null,
        username: fallbackUsername,
        isGuest: true,
        guestId: guestId,
      };
    }

    next();
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthedSocket;
    logger.info(`User connected: ${socket.user.username} (${socket.id})`);

    // Room events
    socket.on('room:join', async (data: { roomCode: string }) => {
      try {
        const normalizedCode = data.roomCode.toUpperCase();
        logger.info('room:join', {
          roomCode: normalizedCode,
          original: data.roomCode,
          username: socket.user.username,
        });

        // Idempotency: if this socket is already in this room, just re-sync state
        if (socket.roomCode === normalizedCode && socket.participantId) {
          logger.info('room:join idempotent re-sync', {
            roomCode: normalizedCode,
            participantId: socket.participantId,
          });
          const updatedRoom = await roomService.getRoomByCode(normalizedCode);
          socket.emit('room:joined', { room: updatedRoom, participantId: socket.participantId });
          return;
        }

        const room = await roomService.getRoomByCode(normalizedCode);
        if (!room) {
          logger.warn('room not found', { roomCode: normalizedCode });
          socket.emit('room:error', { message: 'Room not found' });
          return;
        }

        logger.info('room found; joining participant', {
          roomId: room.get('id'),
          status: room.get('status'),
        });

        const joiningPlayerId = getSocketPlayerId(socket);
        if (room.room_type === 'duel' && duelForfeitedPlayers.get(normalizedCode)?.has(joiningPlayerId)) {
          socket.emit('duel:rejoin-blocked', {
            roomCode: normalizedCode,
            reason: 'forfeit_on_disconnect',
          });
          socket.emit('room:error', {
            message: 'You forfeited this duel by leaving and cannot rejoin.',
          });
          return;
        }

        const { participant, participantId } = await roomService.joinRoom({
          roomId: room.get('id'),
          userId: socket.user.isGuest ? null : socket.user.id,
          guestId: socket.user.isGuest ? (socket.user.guestId || socket.id) : null,
          displayName: socket.user.username || 'Guest',
        });

        logger.info('participant joined', { roomCode: normalizedCode, participantId });

        socket.join(normalizedCode);
        socket.roomCode = normalizedCode;
        socket.participantId = participantId;

        const updatedRoom = await roomService.getRoomByCode(normalizedCode);
        io.to(normalizedCode).emit('room:update', updatedRoom);

        socket.emit('room:joined', { room: updatedRoom, participantId: participantId });
        logger.info('room:joined emitted', { username: socket.user.username, roomCode: normalizedCode });

        // If it's a duel room, send the duel:matched data so the playground can hydrate
        if (updatedRoom?.room_type === 'duel') {
          const { User, Match, MatchResult } = await getModels();
          const match = await Match.findOne({ where: { room_id: updatedRoom.id }, order: [['created_at', 'DESC']] });

          if (match) {
            const participantsResult = await roomService.getRoomById(updatedRoom.id);
            const participants = (participantsResult as any)?.participants ?? [];
            const players = await Promise.all(
              participants.map(async (p: any) => {
                const u = p.user_id ? await User.findByPk(p.user_id) : null;
                return {
                  userId: p.user_id || `guest:${p.guest_id}`,
                  username: u?.display_name || p.display_name,
                  profile_picture: u?.profile_picture,
                  avatar_id: u?.avatar_id,
                };
              })
            );

            socket.matchId = match.getDataValue('id');
            socket.isDuelRoom = true;
            const session: DuelSessionState = duelSessions.get(updatedRoom.room_code) || {
              roomCode: updatedRoom.room_code,
              matchId: match.getDataValue('id'),
              text: match.text_content,
            };
            duelSessions.set(updatedRoom.room_code, session);

            socket.emit('duel:matched', {
              roomCode: updatedRoom.room_code,
              roomId: updatedRoom.id,
              matchId: match.getDataValue('id'),
              players
            });

            // Re-sync finished players
            const results = await MatchResult.findAll({ where: { match_id: match.id } });
            results.forEach((res: any) => {
              const p = players.find(
                (player) => player.userId === (res.user_id || `guest:${res.guest_id}`)
              );
              socket.emit('duel:player-finished', {
                userId: res.user_id || `guest:${res.guest_id}`,
                username: p?.username || 'Opponent',
                wpm: res.wpm,
                accuracy: res.accuracy,
                timeTaken: res.time_taken
              });
            });

            // Also send the duel:start text if match is in progress
            if (updatedRoom.status === 'in_progress') {
              socket.emit('duel:start', {
                text: session.text,
                roomCode: updatedRoom.room_code,
                startedAt: session.startedAt,
              });
            }

            // If match is already completed, send completion data
            if (match.completed_at) {
              const rankingUpdates = await rankingService.processMatchElo(match.id);
              socket.emit('duel:complete', { rankingUpdates });
            }
          }
        }
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
          logger.error('Error leaving room', { error });
        }
      }
    });

    socket.on('room:ready', async (data: { isReady: boolean }) => {
      if (socket.participantId) {
        try {
          await roomService.setPlayerReady(socket.participantId, data.isReady);
          if (!socket.roomCode) return;
          const updatedRoom = await roomService.getRoomByCode(socket.roomCode);
          io.to(socket.roomCode).emit('room:update', updatedRoom);
        } catch (error) {
          logger.error('Error setting ready status', { error });
        }
      }
    });

    socket.on('room:start', async () => {
      if (socket.roomCode) {
        try {
          const room = await roomService.getRoomByCode(socket.roomCode);
          const hostPid = getHostParticipantId(room as any);
          const isHost = hostPid && socket.participantId && hostPid === socket.participantId;

          logger.info('room:start', { roomCode: socket.roomCode, isHost, hostPid });

          if (room && isHost) {
            // Check if all OTHER players are ready
            const participants = (room as any).participants || [];
            const nonHostParticipants = participants.filter((p: any) => p.id !== hostPid);
            const allReady = nonHostParticipants.every((p: any) => p.is_ready);
            const minPlayers = participants.length >= 2;

            logger.info('room:start validation', {
              participants: participants.length,
              nonHostReady: allReady,
              minPlayersMet: minPlayers,
            });

            if (!allReady || !minPlayers) {
              logger.info('room:start failed validation');
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
            const roomCode = socket.roomCode;
            io.to(roomCode).emit('race:countdown', { countdown: 3 });

            setTimeout(() => {
              io.to(roomCode).emit('race:start', {
                text: room.text_content,
                matchId: match.id,
              });
            }, 3000);
          } else {
            socket.emit('room:error', { message: 'Only the host can start the race' });
          }
        } catch (error) {
          logger.error('Error starting race', { error });
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
            // Save individual result (idempotent — matchService should handle duplicates)
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

            // Check if all active players have submitted results using DB count (reliable across reconnects)
            const { MatchResult } = await import('../models/index.js');
            const participantCount = (room as any).participants?.length || 0;
            const resultsCount = await MatchResult.count({ where: { match_id: data.matchId } });

            console.log(`[RaceFinish] Match ${data.matchId}: ${resultsCount}/${participantCount} results submitted.`);

            if (resultsCount >= participantCount && participantCount > 0) {
              // All players finished — complete the match
              const { match, results } = await matchService.completeMatch(data.matchId);
              await roomService.updateRoomStatus(room.id, 'completed');

              console.log(`[RaceFinish] Match ${data.matchId} COMPLETE. Emitting race:complete.`);
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
      const userId = getSocketPlayerId(socket);
      const { User } = await import('../models/index.js');
      const xp = socket.user.isGuest ? 0 : (await User.findByPk(socket.user.id!, { attributes: ['xp'] }))?.xp || 0;

      matchmakingService.enqueue({ userId, username: socket.user.username, socketId: socket.id, xp, joinedAt: Date.now() });

      const opponent = matchmakingService.findOpponent(userId);

      if (opponent) {
        matchmakingService.dequeue(userId);
        matchmakingService.dequeue(opponent.userId);
        matchmakingQueue.delete(userId);
        matchmakingQueue.delete(opponent.userId);

        const room = await roomService.createRoom({
          hostUserId: userId.startsWith('guest:') ? null : userId,
          roomType: 'duel',
          maxPlayers: 2,
          textContent: DUEL_TEXT
        });
        // Use getDataValue to safely retrieve the auto-generated UUID
        const roomId = room.getDataValue('id') as string;
        const match = await matchService.createMatch({
          roomId: roomId,
          matchType: 'duel',
          textContent: DUEL_TEXT
        });

        // Safer property access for Sequelize instances with underscored: true
        const duelRoomCode = room.getDataValue('room_code');
        console.log(`[Matchmaking] Room created. ID: ${roomId}, Code: ${duelRoomCode}`);

        if (!duelRoomCode) {
          console.error('[Matchmaking] FAILED to generate room code.');
          socket.emit('duel:error', { message: 'Failed to create duel room' });
          return;
        }
        socket.join(duelRoomCode);
        io.sockets.sockets.get(opponent.socketId)?.join(duelRoomCode);
        duelSessions.set(duelRoomCode, {
          roomCode: duelRoomCode,
          matchId: match.getDataValue('id'),
          text: DUEL_TEXT,
        });

        // Track room code on socket instances for proper cleanup and debugging
        const matchId = match.getDataValue('id');
        socket.roomCode = duelRoomCode;
        socket.isDuelRoom = true;
        socket.matchId = matchId;
        const opponentSocket = io.sockets.sockets.get(opponent.socketId);
        if (opponentSocket) {
          (opponentSocket as any).roomCode = duelRoomCode;
          (opponentSocket as any).isDuelRoom = true;
          (opponentSocket as any).matchId = matchId;
        }

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
          roomId: roomId,
          matchId: match.getDataValue('id'),
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

        duelParticipants.set(duelRoomCode, [
          {
            playerId: userId,
            username: myUserData?.display_name || socket.user.username,
            socketId: socket.id,
            userId: socket.user.isGuest ? null : socket.user.id,
            guestId: socket.user.isGuest ? getGuestIdentity(socket) : null,
          },
          {
            playerId: opponent.userId,
            username: opponentUserData?.display_name || opponent.username,
            socketId: opponent.socketId,
            userId: opponent.userId.startsWith('guest:') ? null : opponent.userId,
            guestId: opponent.userId.startsWith('guest:') ? opponent.socketId : null,
          },
        ]);
        duelProgress.set(duelRoomCode, new Map());

        io.to(duelRoomCode).emit('duel:matched', matchData);

        // Add a small synchronization delay to ensure both clients have mounted the playground (or are ready in lobby)
        setTimeout(() => {
          io.to(duelRoomCode).emit('race:countdown', { countdown: 3 });
          setTimeout(() => {
            const startedAt = new Date().toISOString();
            duelSessions.set(duelRoomCode, {
              roomCode: duelRoomCode,
              matchId,
              text: DUEL_TEXT,
              startedAt,
            });
            io.to(duelRoomCode).emit('duel:start', {
              text: DUEL_TEXT,
              roomCode: duelRoomCode,
              startedAt,
            });
          }, 3000);
        }, 2000);
      } else {
        // Legacy fallback: also add to old queue for compatibility
        matchmakingQueue.set(userId, socket.id);
        socket.emit('duel:queued', { position: matchmakingService.queueSize() });
      }
    });

    socket.on('duel:cancel', () => {
      if (socket.user.isGuest) {
        matchmakingService.dequeue(getSocketPlayerId(socket));
      } else if (socket.user.id) {
        matchmakingQueue.delete(socket.user.id);
        matchmakingService.dequeue(socket.user.id);
      }
    });

    socket.on('duel:progress', (data: { progress: number; wpm: number; accuracy: number; roomCode: string }) => {
      const userId = getSocketPlayerId(socket);
      const roomProgress = duelProgress.get(data.roomCode);
      roomProgress?.set(userId, {
        progress: data.progress,
        wpm: data.wpm,
        accuracy: data.accuracy,
      });

      socket.to(data.roomCode).emit('duel:opponent-progress', {
        userId: userId,
        username: socket.user.username,
        ...data,
      });
    });

    socket.on('duel:finish', async (data: { wpm: number; accuracy: number; timeTaken: number; roomCode: string; matchId?: string }) => {
      let matchId = data.matchId || socket.matchId;

      // Safety: JSON.stringify(undefined) becomes undefined, but sometimes clients send "undefined" string
      if (matchId === 'undefined') matchId = socket.matchId;

      if (data.roomCode && matchId) {
        try {
          const progressPlayerId = getSocketPlayerId(socket);
          const roomProgress = duelProgress.get(data.roomCode);
          roomProgress?.set(progressPlayerId, {
            progress: 100,
            wpm: data.wpm,
            accuracy: data.accuracy,
            timeTaken: data.timeTaken,
          });

          const res = await matchService.saveResult({
            matchId: matchId,
            userId: socket.user.isGuest ? null : socket.user.id,
            guestId: socket.user.isGuest ? getGuestIdentity(socket) : null,
            wpm: data.wpm,
            accuracy: data.accuracy,
            timeTaken: data.timeTaken,
          });

          console.log(`[DuelFinish] Saved result for ${socket.user.username} in match ${matchId}. Room: ${data.roomCode}`);

          const userId = getSocketPlayerId(socket);
          console.log(`[DuelFinish] Emitting duel:player-finished for ${socket.user.username} (${userId}) in room ${data.roomCode}`);

          io.to(data.roomCode).emit('duel:player-finished', {
            userId: userId,
            username: socket.user.username,
            ...data,
          });

          // Check if match is already completed (in case of reloads or sync delay)
          const { Match, MatchResult } = await import('../models/index.js');
          const matchRecord = await Match.findByPk(matchId);

          if (matchRecord?.completed_at) {
            console.log(`[DuelFinish] Match ${matchId} already completed. Resending completion data.`);
            const rankingUpdates = await rankingService.processMatchElo(matchId);
            socket.emit('duel:complete', { rankingUpdates });
            return;
          }

          const resultsCount = await MatchResult.count({ where: { match_id: matchId } });
          console.log(`[DuelFinish] Match ${matchId} results count: ${resultsCount}/2`);

          // For a 1v1 duel, we expect 2 results
          if (resultsCount >= 2) {
            await matchService.completeMatch(matchId);
            const rankingUpdates = await rankingService.processMatchElo(matchId);

            console.log(`[DuelFinish] Match ${matchId} COMPLETE. Emitting duel:complete to room ${data.roomCode}`);
            io.to(data.roomCode).emit('duel:complete', {
              rankingUpdates
            });

            const room = await roomService.getRoomByCode(data.roomCode);
            if (room) {
              await roomService.updateRoomStatus(room.id, 'completed');
            }
            duelSessions.delete(data.roomCode);
            duelParticipants.delete(data.roomCode);
            duelProgress.delete(data.roomCode);
          }
        } catch (error) {
          console.error('Error in duel:finish:', error);
        }
      }
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
        matchmakingService.dequeue(getSocketPlayerId(socket));
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

      // Duel room cleanup and forfeit handling
      if (socket.roomCode && socket.isDuelRoom) {
        const disconnectedPlayerId = getSocketPlayerId(socket);
        const forfeitedPlayers = duelForfeitedPlayers.get(socket.roomCode) || new Set<string>();
        forfeitedPlayers.add(disconnectedPlayerId);
        duelForfeitedPlayers.set(socket.roomCode, forfeitedPlayers);
        io.to(socket.roomCode).emit('duel:opponent-disconnected', {
          userId: disconnectedPlayerId,
          username: socket.user.username,
        });

        // Treat refresh/disconnect during a duel as a forfeit for the disconnected player.
        if (socket.matchId) {
          try {
            const { Match } = await import('../models/index.js');
            const matchRecord = await Match.findByPk(socket.matchId);
            const players = duelParticipants.get(socket.roomCode) || [];
            const remainingPlayer = players.find((player) => player.playerId !== disconnectedPlayerId);

            if (!matchRecord?.completed_at && remainingPlayer) {
              const roomProgress = duelProgress.get(socket.roomCode);
              const winnerProgress = roomProgress?.get(remainingPlayer.playerId);
              const loserProgress = roomProgress?.get(disconnectedPlayerId);
              const startedAt = duelSessions.get(socket.roomCode)?.startedAt;
              const fallbackElapsed = startedAt
                ? Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
                : 1;
              const winnerTimeTaken = Math.max(1, winnerProgress?.timeTaken || fallbackElapsed);
              const loserTimeTaken = Math.max(
                winnerTimeTaken + 1,
                (loserProgress?.timeTaken || fallbackElapsed) + 1
              );

              await matchService.saveResult({
                matchId: socket.matchId,
                userId: remainingPlayer.userId,
                guestId: remainingPlayer.guestId,
                wpm: winnerProgress?.wpm || 0,
                accuracy: winnerProgress?.accuracy || 100,
                timeTaken: winnerTimeTaken,
              });

              await matchService.saveResult({
                matchId: socket.matchId,
                userId: socket.user.isGuest ? null : socket.user.id,
                guestId: socket.user.isGuest ? getGuestIdentity(socket) : null,
                wpm: loserProgress?.wpm || 0,
                accuracy: loserProgress?.accuracy || 0,
                timeTaken: loserTimeTaken,
              });

              io.to(socket.roomCode).emit('duel:player-finished', {
                userId: remainingPlayer.playerId,
                username: remainingPlayer.username,
                wpm: winnerProgress?.wpm || 0,
                accuracy: winnerProgress?.accuracy || 100,
                timeTaken: winnerTimeTaken,
              });

              io.to(socket.roomCode).emit('duel:player-finished', {
                userId: disconnectedPlayerId,
                username: socket.user.username,
                wpm: loserProgress?.wpm || 0,
                accuracy: loserProgress?.accuracy || 0,
                timeTaken: loserTimeTaken,
              });

              await matchService.completeMatch(socket.matchId);
              const rankingUpdates = (await rankingService.processMatchElo(socket.matchId)) || [];
              io.to(socket.roomCode).emit('duel:complete', { rankingUpdates });

              const room = await roomService.getRoomByCode(socket.roomCode);
              if (room) {
                await roomService.updateRoomStatus(room.id, 'completed');
              }
            duelForfeitedPlayers.delete(socket.roomCode);
            }
          } catch (e) {
            console.error('Error completing duel on disconnect:', e);
          }
        }

        duelSessions.delete(socket.roomCode);
        duelParticipants.delete(socket.roomCode);
        duelProgress.delete(socket.roomCode);
        socket.leave(socket.roomCode);
      }
    });
  });

  return io;
}
