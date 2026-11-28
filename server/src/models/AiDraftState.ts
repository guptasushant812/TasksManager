import mongoose, { Schema, Document } from 'mongoose';
import { applyISTTimestamps } from '../utils/istDate';

export interface IAiDraftState extends Document {
  userId: string;
  rawText: string;
  step: 'input' | 'preview';
  drafts: any[];
  manualDrafts?: any[];
  taskInstructions?: Map<string, string>;
  clearedAt?: Date | null;
  clearedAtIST?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdAtIST?: string;
  updatedAtIST?: string;
}

const AiDraftStateSchema: Schema = new Schema(
  {
    userId: { type: String, default: 'default', index: true },
    rawText: { type: String, default: '' },
    step: { type: String, enum: ['input', 'preview'], default: 'input' },
    drafts: { type: [Schema.Types.Mixed], default: [] },
    manualDrafts: { type: [Schema.Types.Mixed], default: [] },
    taskInstructions: { type: Map, of: String, default: {} },
    clearedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

applyISTTimestamps(AiDraftStateSchema, ['clearedAt']);

export default mongoose.model<IAiDraftState>('AiDraftState', AiDraftStateSchema);
