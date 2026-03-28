import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { challengeService } from '../services/challengeService.js';

export const challengeController = {
  async send(req: AuthRequest, res: Response) {
    try {
      const { challengedId } = req.body;
      const challenge = await challengeService.send(req.user!.id, challengedId);
      res.status(201).json(challenge);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  async getPending(req: AuthRequest, res: Response) {
    try {
      const challenges = await challengeService.getPending(req.user!.id);
      res.json(challenges);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },

  async accept(req: AuthRequest, res: Response) {
    try {
      const result = await challengeService.accept(String(req.params.id), req.user!.id);
      // result contains { challenge, roomCode }
      res.json(result);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  async decline(req: AuthRequest, res: Response) {
    try {
      const challenge = await challengeService.decline(String(req.params.id), req.user!.id);
      res.json(challenge);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
};
