import { Server } from 'socket.io';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-workflow', (workflowId) => {
      socket.join(`workflow:${workflowId}`);
    });

    socket.on('leave-workflow', (workflowId) => {
      socket.leave(`workflow:${workflowId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitLogEntry(workflowId, logEntry) {
  if (io) {
    io.to(`workflow:${workflowId}`).emit('execution-log', logEntry);
  }
}
