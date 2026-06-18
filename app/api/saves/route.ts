import { NextResponse } from 'next/server';
import { getAllSaves } from '@/lib/db/dashboard-queries';
import { getTeamForUser } from '@/lib/db/queries';

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
