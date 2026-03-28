import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function generateTokens(user: { id: string; email?: string; display_name: string }) {
  const payload = { id: user.id, email: user.email, display_name: user.display_name };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ where: { google_id: googleId } });

    if (!user) {
      user = await User.create({
        google_id: googleId,
        email: email || undefined,
        display_name: name || 'User',
        profile_picture: picture || undefined,
      });
    } else if (picture && user.profile_picture !== picture) {
      // Update profile picture if it changed
      user.profile_picture = picture;
      await user.save();
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_id: user.avatar_id,
        profile_picture: user.profile_picture,
        level: user.level,
        xp: user.xp,
      },
    });
  } catch (error) {
    logger.error('Google login error', { error });
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      bio: user.bio,
      avatar_id: user.avatar_id,
      profile_picture: user.profile_picture,
      level: user.level,
      xp: user.xp,
      best_wpm: user.best_wpm,
      avg_wpm: user.avg_wpm,
      total_tests: user.total_tests,
      streak_days: user.streak_days,
      last_active: user.last_active,
      created_at: user.created_at,
    });
  } catch (error) {
    logger.error('Get me error', { error });
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!) as { id: string };
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token: accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};
