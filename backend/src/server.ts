import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { buildApp } from './app';
import { config } from './config/env';

async function startServer() {
  const fastifyApp = buildApp();
  await fastifyApp.ready();

  const server = http.createServer(fastifyApp.server);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Attach socket.io instance to fastify
  (fastifyApp as any).io = io;

  io.on('connection', (socket) => {
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {});
  });

  server.listen(config.port, () => {
    console.log(`🚀 Campus Exchange API server running on http://localhost:${config.port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
