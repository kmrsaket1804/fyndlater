import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { isReelPipelineConfigured, isReelUrl } from '@/lib/reel-pipeline';
import { createSave } from '@/lib/saves/create-save';

export const runtime = 'nodejs';
export const maxDuration = 30;

const bodySchema = z.object({
  reelUrl: z.string().url(),
});

export async function POST(request: Request) {
  if (!isReelPipelineConfigured()) {
    return NextResponse.json(
      { error: 'Reel pipeline is not configured' },
      { status: 503 }
    );
  }

  const user = await getUser();
  const team = await getTeamForUser();
  if (!user || !team) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!isReelUrl(parsed.data.reelUrl)) {
    return NextResponse.json(
      { error: 'URL must be an Instagram reel link' },
      { status: 400 }
    );
  }

  const save = await createSave({
    kind: 'link',
    url: parsed.data.reelUrl,
  });

  return NextResponse.json(
    {
      saveId: save.id,
      status: 'queued',
    },
    { status: 202 }
  );
}
