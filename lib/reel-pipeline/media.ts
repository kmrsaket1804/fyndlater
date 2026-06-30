import { createWriteStream } from 'node:fs';
import { accessSync, constants } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import ffmpegStatic from 'ffmpeg-static';
import { ensureDir, execFileAsync } from './utils';

const bundledFfmpegPath = path.join(
  process.cwd(),
  'lib/reel-pipeline/bin/ffmpeg'
);

function getFfmpegPath(): string {
  const candidates = [
    process.env.FFMPEG_PATH,
    bundledFfmpegPath,
    typeof ffmpegStatic === 'string' ? ffmpegStatic : null,
    'ffmpeg',
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    'ffmpeg binary not found. The ffmpeg-static install step may have failed during deployment.'
  );
}

export async function downloadFile(url: string, outputPath: string) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(
      `Video download failed: ${response.status} ${response.statusText}`
    );
  }

  await ensureDir(path.dirname(outputPath));
  const nodeStream = Readable.fromWeb(
    response.body as Parameters<typeof Readable.fromWeb>[0]
  );
  await pipeline(nodeStream, createWriteStream(outputPath));
}

export async function extractFrames(
  videoPath: string,
  framesDir: string
): Promise<string[]> {
  await ensureDir(framesDir);

  const everySeconds = Number(process.env.FRAME_EVERY_SECONDS ?? '2');
  const fpsExpr = `fps=1/${Math.max(1, everySeconds)},scale=768:-1`;

  await execFileAsync(getFfmpegPath(), [
    '-y',
    '-i',
    videoPath,
    '-vf',
    fpsExpr,
    '-q:v',
    '3',
    path.join(framesDir, 'frame_%03d.jpg'),
  ]);

  const files = (await readdir(framesDir))
    .filter((f) => f.endsWith('.jpg'))
    .sort()
    .map((f) => path.join(framesDir, f));

  return selectEvenly(files, Number(process.env.MAX_FRAMES ?? '20'));
}

export async function extractAudio(
  videoPath: string,
  audioPath: string
): Promise<string | undefined> {
  try {
    await ensureDir(path.dirname(audioPath));
    await execFileAsync(getFfmpegPath(), [
      '-y',
      '-i',
      videoPath,
      '-vn',
      '-acodec',
      'libmp3lame',
      '-ar',
      '16000',
      '-ac',
      '1',
      audioPath,
    ]);
    return audioPath;
  } catch {
    return undefined;
  }
}

function selectEvenly<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const selected: T[] = [];
  for (let i = 0; i < max; i++) {
    const idx = Math.round((i * (items.length - 1)) / (max - 1));
    selected.push(items[idx]);
  }
  return selected;
}
