import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager';
  try {
    await mongoose.connect(uri);
    console.log(`✅  MongoDB connected: ${uri}`);
  } catch (err) {
    console.error('❌  MongoDB connection error:', err);
    process.exit(1);
  }
}
