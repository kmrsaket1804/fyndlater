/**
 * Cancel stuck saves and purge in-flight Vercel Queue messages.
 *
 * Usage:
 *   pnpm clear-pending              # mark processing saves as failed
 *   pnpm clear-pending --purge-queue  # also ack/delete queued reel-jobs
 */
import { config } from 'dotenv';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { PollingQueueClient } from '@vercel/queue';
import { db } from '../lib/db/drizzle';
import { savedItems, saves } from '../lib/db/schema';
import { REEL_JOBS_TOPIC } from '../lib/reel-pipeline/queue';

config({ path: '.env' });

const CONSUMER_GROUP = 'app_Sapi_Squeues_Sprocess-reel_Sroute_Dts';
const CANCEL_REASON = 'Cancelled — stale queue job cleared by admin';

async function cancelPendingSaves() {
  const pending = await db
    .select({ id: saves.id, title: saves.title })
    .from(saves)
    .where(eq(saves.status, 'processing'));

  if (!pending.length) {
    console.log('No saves in processing state.');
    return 0;
  }

  const ids = pending.map((row) => row.id);

  await db
    .update(saves)
    .set({
      status: 'failed',
      description: CANCEL_REASON,
      updatedAt: new Date(),
    })
    .where(inArray(saves.id, ids));

  await db
    .update(savedItems)
    .set({ embeddingStatus: 'failed' })
    .where(
      sql`${savedItems.metadata}->>'saveId' IN (${sql.join(
        ids.map((id) => sql`${String(id)}`),
        sql`, `
      )})`
    );

  console.log(`Cancelled ${pending.length} processing save(s):`);
  for (const row of pending) {
    console.log(`  - #${row.id}: ${row.title}`);
  }

  return pending.length;
}

async function purgeQueue() {
  const region = process.env.VERCEL_QUEUE_REGION ?? 'iad1';
  const client = new PollingQueueClient({ region });
  let purged = 0;

  console.log(`Purging topic "${REEL_JOBS_TOPIC}" (consumer: ${CONSUMER_GROUP})…`);

  for (;;) {
    const result = await client.receive(
      REEL_JOBS_TOPIC,
      CONSUMER_GROUP,
      async () => {
        /* ack-only — drop message */
      },
      { limit: 10 }
    );

    if (!result.ok) {
      if (result.reason === 'empty') {
        break;
      }
      console.warn('Queue receive stopped:', result);
      break;
    }

    purged += 1;
    if (purged % 10 === 0) {
      console.log(`  purged ${purged} message(s)…`);
    }
  }

  console.log(`Purged ${purged} queue message(s).`);
  return purged;
}

async function main() {
  const purgeQueueFlag = process.argv.includes('--purge-queue');

  const cancelled = await cancelPendingSaves();

  if (purgeQueueFlag) {
    if (!process.env.VERCEL_OIDC_TOKEN) {
      console.warn(
        'Skipping queue purge — VERCEL_OIDC_TOKEN not set. Run `vercel env pull .env` first.'
      );
    } else {
      await purgeQueue();
    }
  } else {
    console.log(
      'Tip: deploy the queue consumer fix, then run with --purge-queue to drain stale messages.'
    );
  }

  console.log(`\nDone. Cancelled ${cancelled} save(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
