require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`[CareConnect Backend] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[CareConnect Backend] Health check: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(`\n[CareConnect Backend] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[CareConnect Backend] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
