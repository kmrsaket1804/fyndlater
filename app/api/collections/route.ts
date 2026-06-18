import { NextResponse } from 'next/server';
import { getCollectionsForTeam } from '@/lib/db/dashboard-queries';
import { getTeamForUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collections = await getCollectionsForTeam(team.id);
    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Failed to load collections:', error);
    return NextResponse.json(
      { error: 'Failed to load collections' },
      { status: 500 }
    );
  }
}
