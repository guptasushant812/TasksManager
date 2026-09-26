import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFollowUpAttachment extends Document {
  followUpId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  originalName: string;
  storedName?: string;
  mimeType: string;
  sizeBytes: number;
  data?: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpAttachmentSchema = new Schema<IFollowUpAttachment>(
  {
    followUpId: { type: Schema.Types.ObjectId, ref: 'FollowUp', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: false },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

const FollowUpAttachment: Model<IFollowUpAttachment> =
  mongoose.models.FollowUpAttachment || mongoose.model<IFollowUpAttachment>('FollowUpAttachment', FollowUpAttachmentSchema);

export default FollowUpAttachment;
