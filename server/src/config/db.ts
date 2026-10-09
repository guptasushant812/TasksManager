import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager';
  try {
    await mongoose.connect(uri);
    const host = mongoose.connection.host || 'cluster';
    const dbName = mongoose.connection.name || 'taskmanager';
    console.log(`✅  MongoDB connected successfully [Host: ${host}, DB: ${dbName}]`);
  } catch (err) {
    console.error('❌  MongoDB connection error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
