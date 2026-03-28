import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        display_name: string;
      };
      identity?: {
        type: 'user' | 'guest';
        id: string;
      };
    }
  }
}
