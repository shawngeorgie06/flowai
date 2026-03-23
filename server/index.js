import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { initSocket } from './services/socket.js';
import { loadActiveWorkflows } from './services/scheduler.js';
import workflowRoutes from './routes/workflows.js';
import hookRoutes from './routes/hooks.js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Make prisma available to routes
app.set('prisma', prisma);

// Routes
app.use('/api/workflows', workflowRoutes);
app.use('/hooks', hookRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serve frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/hooks') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');

    initSocket(server);
    await loadActiveWorkflows(prisma);

    server.listen(PORT, () => {
      console.log(`FlowAI server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
});

start();
