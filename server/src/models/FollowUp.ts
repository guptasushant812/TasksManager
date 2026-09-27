import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Types ────────────────────────────────────────────────────────────────────
export type FollowUpMethod = 'Phone' | 'WhatsApp' | 'Email' | 'InPerson' | 'Teams' | 'GoogleMeet' | 'Other';

export const FOLLOW_UP_METHODS: FollowUpMethod[] = [
  'Phone', 'WhatsApp', 'Email', 'InPerson', 'Teams', 'GoogleMeet', 'Other',
];

export interface IFollowUp extends Document {
  taskId: mongoose.Types.ObjectId;
  followUpNumber: number;
  followUpDate: Date;
  method: FollowUpMethod;
  methodOther: string;
  contactPerson: string;
  communicated: string;
  responseReceived: string;
  notes: string;
  nextAction: string;
  nextFollowUpDate: Date | null;
  isDeleted: boolean;
  deletedReason: string;
  attachments: { url: string; public_id: string; filename: string }[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────────────────────
const FollowUpSchema = new Schema<IFollowUp>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    followUpNumber: { type: Number, required: true },
    followUpDate: { type: Date, required: true },
    method: {
      type: String,
      enum: FOLLOW_UP_METHODS,
      default: 'Phone',
    },
    methodOther: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    communicated: { type: String, required: true, maxlength: 5000 },
    responseReceived: { type: String, default: '', maxlength: 5000 },
    notes: { type: String, default: '', maxlength: 2000 },
    nextAction: { type: String, default: '', maxlength: 2000 },
    nextFollowUpDate: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedReason: { type: String, default: '' },
    attachments: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        filename: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
FollowUpSchema.index({ taskId: 1, followUpNumber: 1 });
FollowUpSchema.index({ taskId: 1, isDeleted: 1, followUpDate: -1 });
FollowUpSchema.index({ nextFollowUpDate: 1, isDeleted: 1 });

// ── Helper: get next follow-up number for a task ─────────────────────────────
export async function getNextFollowUpNumber(taskId: mongoose.Types.ObjectId): Promise<number> {
  const last = await FollowUp.findOne({ taskId }).sort({ followUpNumber: -1 }).lean();
  return last ? last.followUpNumber + 1 : 1;
}

// ── Model ────────────────────────────────────────────────────────────────────
const FollowUp: Model<IFollowUp> =
  mongoose.models.FollowUp || mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);

export default FollowUp;
