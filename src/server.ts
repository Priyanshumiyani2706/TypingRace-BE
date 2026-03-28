import { createServer } from 'http';
import app from './app.js';
import sequelize from './db/config.js';
import dotenv from 'dotenv';
import { initializeSocket } from './socket/index.js';

dotenv.config();

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Sync models (in development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✓ Database models synchronized');
    }

    // Create HTTP server and initialize Socket.IO
    const httpServer = createServer(app);
    const io = initializeSocket(httpServer);
    console.log('✓ WebSocket server initialized');

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('✗ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
