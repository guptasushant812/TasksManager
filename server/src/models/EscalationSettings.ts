import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRecipientItem {
  email: string;
  tag: string;
}

export interface IEscalationSettings extends Document {
  threshold: number;
  enabled: boolean;
  toRecipients: IRecipientItem[];
  ccRecipients: IRecipientItem[];
  bccRecipients: IRecipientItem[];
  // Legacy fields preserved for backward compatibility
  managerEmail: string;
  hodEmail: string;
  dyhodEmail: string;
  ccEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecipientItemSchema = new Schema<IRecipientItem>(
  {
    email: { type: String, required: true, trim: true },
    tag: { type: String, required: true, trim: true, default: 'Member' },
  },
  { _id: false }
);

const EscalationSettingsSchema = new Schema<IEscalationSettings>(
  {
    threshold: { type: Number, required: true, default: 3 },
    enabled: { type: Boolean, required: true, default: false },
    toRecipients: { type: [RecipientItemSchema], default: [] },
    ccRecipients: { type: [RecipientItemSchema], default: [] },
    bccRecipients: { type: [RecipientItemSchema], default: [] },
    managerEmail: { type: String, default: '' },
    hodEmail: { type: String, default: '' },
    dyhodEmail: { type: String, default: '' },
    ccEmail: { type: String, default: '' },
  },
  { timestamps: true }
);

const EscalationSettings: Model<IEscalationSettings> =
  mongoose.models.EscalationSettings || mongoose.model<IEscalationSettings>('EscalationSettings', EscalationSettingsSchema);

export default EscalationSettings;
