import mongoose, { Schema, Document } from 'mongoose';

export interface IAiDraftState extends Document {
  userId: string;
  rawText: string;
  step: 'input' | 'preview';
  drafts: any[];
  createdAt: Date;
  updatedAt: Date;
}

const AiDraftStateSchema: Schema = new Schema(
  {
    userId: { type: String, default: 'default', index: true },
    rawText: { type: String, default: '' },
    step: { type: String, enum: ['input', 'preview'], default: 'input' },
    drafts: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IAiDraftState>('AiDraftState', AiDraftStateSchema);
