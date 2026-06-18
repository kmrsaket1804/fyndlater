import { NextRequest, NextResponse } from 'next/server';
import { askFaye, getAskPageData } from '@/lib/db/ask-queries';

export async function GET() {
  try {
    const data = await getAskPageData();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Team not found') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error('Failed to load Ask Faye data:', error);
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body.query === 'string' ? body.query : '';

    const result = await askFaye(query);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Team not found') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === 'Query is required') {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error('Ask Faye search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
