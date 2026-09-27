import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEscalationSettings extends Document {
  threshold: number;
  enabled: boolean;
  managerEmail: string;
  hodEmail: string;
  dyhodEmail: string;
  ccEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const EscalationSettingsSchema = new Schema<IEscalationSettings>(
  {
    threshold: { type: Number, required: true, default: 3 },
    enabled: { type: Boolean, required: true, default: false },
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
