import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import testResultRoutes from './routes/testResults.js';
import trophyRoutes from './routes/trophies.js';
import avatarRoutes from './routes/avatars.js';
import leaderboardRoutes from './routes/leaderboards.js';
import roomRoutes from './routes/room.js';
import matchRoutes from './routes/match.js';
import challengeRoutes from './routes/challenges.js';
import statsRoutes from './routes/stats.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/auth', authLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/test-results', testResultRoutes);
app.use('/api/trophies', trophyRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

export default app;
