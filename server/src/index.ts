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

// ── Middleware & Security Headers ──────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const { hostname } = new URL(origin);
        if (
          allowedOrigins.includes(origin) ||
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.endsWith('.vercel.app') ||
          process.env.NODE_ENV !== 'production'
        ) {
          return callback(null, true);
        }
      } catch {
        // invalid origin url
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
);

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.get('/api/f/:id/:filename?', downloadAttachment);

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
