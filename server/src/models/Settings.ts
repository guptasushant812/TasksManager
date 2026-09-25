import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface ISettings extends Document {
  isPublicShareEnabled: boolean;
  publicShareToken: string;
}

const SettingsSchema: Schema = new Schema(
  {
    isPublicShareEnabled: { type: Boolean, default: false },
    publicShareToken: { 
      type: String, 
      default: () => crypto.randomBytes(16).toString('hex') 
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>('Settings', SettingsSchema);
