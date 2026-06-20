import { NextRequest, NextResponse } from 'next/server';
import { getAllSaves } from '@/lib/db/dashboard-queries';
import { getTeamForUser } from '@/lib/db/queries';
import {
  createSave,
  type CreateSaveInput,
} from '@/lib/saves/create-save';

export async function GET() {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const saves = await getAllSaves(team.id);
    return NextResponse.json({ saves });
  } catch (error) {
    console.error('Failed to load saves:', error);
    return NextResponse.json(
      { error: 'Failed to load saves' },
      { status: 500 }
    );
  }
}

function parseCreateSaveBody(body: unknown): CreateSaveInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const data = body as Record<string, unknown>;
  const kind = data.kind;

  if (kind === 'link') {
    if (typeof data.url !== 'string' || !data.url.trim()) {
      throw new Error('URL is required');
    }
    return {
      kind: 'link',
      url: data.url.trim(),
      note: typeof data.note === 'string' ? data.note : undefined,
    };
  }

  if (kind === 'note') {
    if (typeof data.text !== 'string' || !data.text.trim()) {
      throw new Error('Note text is required');
    }
    return { kind: 'note', text: data.text.trim() };
  }

  if (kind === 'screenshot') {
    if (typeof data.imageUrl !== 'string' || !data.imageUrl.startsWith('data:image/')) {
      throw new Error('A valid image upload is required');
    }
    return {
      kind: 'screenshot',
      imageUrl: data.imageUrl,
      title: typeof data.title === 'string' ? data.title : undefined,
    };
  }

  throw new Error('Invalid save type');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = parseCreateSaveBody(body);
    const save = await createSave(input);
    return NextResponse.json({ save }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Unauthorized' || message === 'Team not found') {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (
      message.includes('save limit') ||
      message.includes('too large') ||
      message.includes('required') ||
      message.includes('Invalid')
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Failed to create save:', error);
    return NextResponse.json(
      { error: 'Failed to create save' },
      { status: 500 }
    );
  }
}
