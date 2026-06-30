import 'dotenv/config';
import { processReelJob } from '../lib/reel-pipeline/graph';

const reelUrl = process.argv[2];

if (!reelUrl) {
  console.error(
    'Usage: pnpm reel:cli -- "https://www.instagram.com/reel/REEL_ID/"'
  );
  process.exit(1);
}

try {
  const record = await processReelJob(reelUrl);
  console.log('\nFinal record:\n');
  console.log(JSON.stringify(record, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
}
