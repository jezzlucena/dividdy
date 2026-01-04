import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import authRoutes from './routes/auth.js';
import balancesRoutes from './routes/balances.js';
import categoriesRoutes from './routes/categories.js';
import commentsRoutes from './routes/comments.js';
import expensesRoutes from './routes/expenses.js';
import groupsRoutes from './routes/groups.js';
import membersRoutes from './routes/members.js';
import settlementsRoutes from './routes/settlements.js';
import usersRoutes from './routes/users.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(__dirname, '..', uploadDir)));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/groups', membersRoutes);
app.use('/api/groups', expensesRoutes);
app.use('/api/groups', settlementsRoutes);
app.use('/api/groups', balancesRoutes);
app.use('/api/groups', categoriesRoutes);
app.use('/api/expenses', commentsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.listen(PORT, () => {
  console.info(`🚀 Dividdy API server running on http://localhost:${PORT}`);
});

export default app;

