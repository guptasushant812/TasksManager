import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface ISettings extends Document {
  isPublicShareEnabled: boolean;
  publicShareToken: string;
  masterPasswordHash?: string | null;
  passwordUpdatedAt?: Date | null;
  aiKeys?: {
    gemini?: string;
    groq?: string;
    grok?: string;
  };
  preferredAiModel?: string;
  activeAiProvider?: string;
}

const SettingsSchema: Schema = new Schema(
  {
    isPublicShareEnabled: { type: Boolean, default: false },
    publicShareToken: { 
      type: String, 
      default: () => crypto.randomBytes(16).toString('hex') 
    },
    masterPasswordHash: { type: String, default: null },
    passwordUpdatedAt: { type: Date, default: null },
    aiKeys: {
      gemini: { type: String, default: '' },
      groq: { type: String, default: '' },
      grok: { type: String, default: '' },
    },
    preferredAiModel: { type: String, default: 'auto' },
    activeAiProvider: { type: String, default: 'gemini' },
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>('Settings', SettingsSchema);
