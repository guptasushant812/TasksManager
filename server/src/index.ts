import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
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
import { sessionValidator } from './middleware/sessionValidator';
import { isOriginAllowed } from './utils/security';

const app = express();
const PORT = process.env.PORT || 4000;

// Configure Express trust proxy securely
// In production behind reverse proxies (Render, Cloudflare, Vercel, Nginx), trust immediate upstream hop
const trustProxyEnv = process.env.TRUST_PROXY;
if (trustProxyEnv) {
  app.set('trust proxy', trustProxyEnv === 'true' ? true : isNaN(Number(trustProxyEnv)) ? trustProxyEnv : Number(trustProxyEnv));
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', false);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
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
app.use('/api', sessionValidator);

// ai-draft must be mounted before tasks router to avoid route conflicts
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

// Health check with database readiness status
app.get('/api/health', (_req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    db: isDbConnected ? 'connected' : 'connecting',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
  connectDB().catch((err) => {
    console.error('❌  Failed to connect to MongoDB:', err);
  });
});

export default app;
