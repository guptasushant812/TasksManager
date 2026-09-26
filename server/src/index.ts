import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import taskRoutes from './routes/tasks';
import summaryRoutes from './routes/summary';
import aiDraftRoutes from './routes/aiDraft';
import exportRoutes from './routes/export';
import settingsRoutes from './routes/settings';
import publicRoutes from './routes/public';
import followUpRoutes from './routes/followUps';
import attachmentRoutes from './routes/attachments';
import escalationRoutes from './routes/escalations';
import { downloadAttachment } from './controllers/attachmentController';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────────────────────
// IMPORTANT: ai-draft must be mounted BEFORE the tasks router
app.use('/api/ai-draft', aiDraftRoutes);
app.use('/api/tasks/:taskId/follow-ups/:followUpId/attachments', attachmentRoutes);
app.use('/api/tasks/:taskId/follow-ups', followUpRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/public', publicRoutes);
app.get('/api/attachments/:id/download/:filename?', downloadAttachment);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
  });
});

export default app;
