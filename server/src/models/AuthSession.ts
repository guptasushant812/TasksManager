import mongoose, { Schema, Document } from 'mongoose';
import { applyISTTimestamps } from '../utils/istDate';

export interface IAuthSession extends Document {
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  loginAt: Date;
  loginAtIST?: string;
  lastActiveAt: Date;
  lastActiveAtIST?: string;
  expiresAt: Date | null;
  expiresAtIST?: string | null;
  logoutAt: Date | null;
  logoutAtIST?: string | null;
  durationSeconds: number;
  status: 'active' | 'logged_out' | 'expired' | 'revoked';
  logoutReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdAtIST?: string;
  updatedAtIST?: string;
}

const AuthSessionSchema: Schema = new Schema(
  {
    sessionToken: { type: String, required: true, unique: true, index: true },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: '' },
    browser: { type: String, default: 'Unknown Browser' },
    os: { type: String, default: 'Unknown OS' },
    device: { type: String, default: 'Desktop' },
    loginAt: { type: Date, default: Date.now, index: true },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    logoutAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'logged_out', 'expired', 'revoked'],
      default: 'active',
      index: true,
    },
    logoutReason: { type: String, default: null },
  },
  { timestamps: true }
);

applyISTTimestamps(AuthSessionSchema, ['loginAt', 'lastActiveAt', 'expiresAt', 'logoutAt']);

export default mongoose.model<IAuthSession>('AuthSession', AuthSessionSchema);
