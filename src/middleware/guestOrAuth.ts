import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface GuestOrAuthRequest extends Request {
  identity?: {
    type: 'user' | 'guest';
    id: string;
  };
  user?: {
    id: string;
    email?: string;
    display_name: string;
  };
}

export const guestOrAuthMiddleware = (req: GuestOrAuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    // Try JWT first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          id: string;
          email?: string;
          display_name: string;
        };
        req.user = decoded;
        req.identity = { type: 'user', id: decoded.id };
        next();
        return;
      } catch (error) {
        // Token invalid, fall through to guest check
      }
    }

    // Fall back to anon_id
    const anonId = req.body.anon_id || req.headers['x-anon-id'];
    if (anonId) {
      req.identity = { type: 'guest', id: anonId as string };
      next();
      return;
    }

    res.status(401).json({ error: 'Authentication required (JWT or anon_id)' });
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};
