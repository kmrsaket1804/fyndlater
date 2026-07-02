import { createWriteStream } from 'node:fs';
import {
  accessSync,
  chmodSync,
  constants,
  copyFileSync,
  existsSync,
} from 'node:fs';
import { readdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import os from 'node:os';
import path from 'node:path';
import { ensureDir, execFileAsync } from './utils';

const BUNDLED_FFMPEG_DIR = 'lib/reel-pipeline/bin';
const BUNDLED_FFMPEG_REL = `${BUNDLED_FFMPEG_DIR}/ffmpeg`;
const RUNTIME_FFMPEG = '/tmp/fyndlater-ffmpeg';

let cachedFfmpegPath: string | null = null;

function normalizeArch(arch: string) {
  if (arch === 'amd64') return 'x64';
  return arch;
}

function bundledCandidates(): string[] {
  const platform = process.platform;
  const arch = normalizeArch(process.arch);
  const root = process.cwd();

  return [
    path.join(root, BUNDLED_FFMPEG_DIR, `ffmpeg-${platform}-${arch}`),
    path.join(root, BUNDLED_FFMPEG_REL),
  ];
}

function validateExecutable(binaryPath: string) {
  accessSync(binaryPath, constants.X_OK);
}

function getFfmpegPath(): string {
  if (cachedFfmpegPath) {
    return cachedFfmpegPath;
  }

  if (process.env.FFMPEG_PATH) {
    accessSync(process.env.FFMPEG_PATH, constants.F_OK);
    validateExecutable(process.env.FFMPEG_PATH);
    cachedFfmpegPath = process.env.FFMPEG_PATH;
    return cachedFfmpegPath;
  }

  let lastError: Error | undefined;

  for (const bundled of bundledCandidates()) {
    if (!existsSync(bundled)) {
      continue;
    }

    try {
      copyFileSync(bundled, RUNTIME_FFMPEG);
      chmodSync(RUNTIME_FFMPEG, 0o755);
      validateExecutable(RUNTIME_FFMPEG);
      console.info('[reel-pipeline] Using ffmpeg at', RUNTIME_FFMPEG, {
        source: bundled,
        runtime: `${os.platform()}/${os.arch()}`,
      });
      cachedFfmpegPath = RUNTIME_FFMPEG;
      return cachedFfmpegPath;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `No compatible ffmpeg binary found for ${os.platform()}/${os.arch()}. ` +
      `Checked: ${bundledCandidates().join(', ')}. ` +
      (lastError ? lastError.message : '')
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
