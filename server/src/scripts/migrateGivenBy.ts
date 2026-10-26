import 'dotenv/config';
import mongoose from 'mongoose';
import { normalizeGivenBy } from '../utils/normalizeGivenBy';

async function previewAndMigrate(isDryRun: boolean = true) {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI or MONGO_URI is missing from environment variables');
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed');
  }

  const tasks = await db.collection('tasks').find({}).toArray();
  console.log(`Found ${tasks.length} total tasks.`);

  const changes: { id: unknown; title: string; from: string; to: string }[] = [];
  const afterCounts: Record<string, number> = {};

  for (const task of tasks) {
    const original = (task.givenBy || '').toString();
    const normalized = normalizeGivenBy(original);

    afterCounts[normalized || '(Empty)'] = (afterCounts[normalized || '(Empty)'] || 0) + 1;

    if (original !== normalized) {
      changes.push({
        id: task._id,
        title: task.title,
        from: original,
        to: normalized,
      });

      if (!isDryRun) {
        await db.collection('tasks').updateOne(
          { _id: task._id },
          { $set: { givenBy: normalized } }
        );
      }
    }
  }

  console.log(`\n=== ${isDryRun ? 'DRY RUN' : 'APPLIED'} SUMMARY ===`);
  console.log(`Tasks to update: ${changes.length} of ${tasks.length}`);

  console.log('\n--- Sample Changes ---');
  for (const c of changes.slice(0, 30)) {
    console.log(`"${c.from}" -> "${c.to}" (Task: "${c.title.substring(0, 35)}")`);
  }

  console.log('\n--- Distinct Values After Normalization ---');
  const sortedAfter = Object.entries(afterCounts).sort((a, b) => b[1] - a[1]);
  for (const [val, count] of sortedAfter) {
    console.log(`${val} : ${count}`);
  }

  await mongoose.disconnect();
}

const isDryRun = process.argv.includes('--dry-run');
previewAndMigrate(isDryRun).catch((err) => {
  console.error(err);
  process.exit(1);
});
