import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Types ────────────────────────────────────────────────────────────────────
export type Priority = 'High' | 'Medium' | 'Low';
export type WorkStatus = 'InProgress' | 'Pending' | 'Completed';

export interface ITask extends Document {
  userId: string | null;
  taskId: string;
  title: string;
  description: string;
  givenBy: string;
  contactPerson: string;
  priority: Priority;
  workStatus: WorkStatus;
  reason: string;
  remarks: string;
  inProgressReason: string;
  pendingReason: string;
  completedRemarks: string;
  date: Date;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Counter helper (auto-increment taskId) ───────────────────────────────────
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

export async function getNextTaskId(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    'taskId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const num = String(counter.seq).padStart(4, '0');
  return `TK-${num}`;
}

// ── Schema ───────────────────────────────────────────────────────────────────
const TaskSchema = new Schema<ITask>(
  {
    userId: { type: String, default: null },
    taskId: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    givenBy: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    workStatus: {
      type: String,
      enum: ['InProgress', 'Pending', 'Completed'],
      default: 'Pending',
    },
    reason: { type: String, default: '' },
    remarks: { type: String, default: '' },
    inProgressReason: { type: String, default: '' },
    pendingReason: { type: String, default: '' },
    completedRemarks: { type: String, default: '' },
    date: { type: Date, required: true },
    dueDate: { type: Date, default: null },
  },
  {
    timestamps: true, // auto-manages createdAt & updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
TaskSchema.index({ date: -1, workStatus: 1 });
TaskSchema.index({ workStatus: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ userId: 1 });
TaskSchema.index({ title: 'text', description: 'text', givenBy: 'text' });

// ── Model ────────────────────────────────────────────────────────────────────
const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
