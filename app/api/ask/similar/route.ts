import { NextRequest, NextResponse } from 'next/server';
import { findSimilarSaves } from '@/lib/db/ask-queries';
import { getTeamForUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const saveId = Number(request.nextUrl.searchParams.get('saveId'));
    if (!saveId) {
      return NextResponse.json({ error: 'saveId is required' }, { status: 400 });
    }

    const similar = await findSimilarSaves(team.id, saveId);
    return NextResponse.json({ similar });
  } catch (error) {
    console.error('Failed to find similar saves:', error);
    return NextResponse.json(
      { error: 'Failed to find similar saves' },
      { status: 500 }
    );
  }
}
