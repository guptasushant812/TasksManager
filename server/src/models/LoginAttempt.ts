import mongoose, { Schema, Document } from 'mongoose';
import { applyISTTimestamps } from '../utils/istDate';

export interface ILoginAttempt extends Document {
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  success: boolean;
  attemptedAt: Date;
  attemptedAtIST?: string;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdAtIST?: string;
  updatedAtIST?: string;
}

const LoginAttemptSchema: Schema = new Schema(
  {
    ipAddress: { type: String, required: true, index: true },
    userAgent: { type: String, default: '' },
    browser: { type: String, default: 'Unknown Browser' },
    os: { type: String, default: 'Unknown OS' },
    device: { type: String, default: 'Desktop' },
    success: { type: Boolean, required: true, index: true },
    attemptedAt: { type: Date, default: Date.now, index: true },
    failureReason: { type: String, default: null },
  },
  { timestamps: true }
);

applyISTTimestamps(LoginAttemptSchema, ['attemptedAt']);

export default mongoose.model<ILoginAttempt>('LoginAttempt', LoginAttemptSchema);
