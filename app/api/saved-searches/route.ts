import { NextResponse } from 'next/server';
import { getSavedSearchesForTeam } from '@/lib/db/dashboard-queries';
import { getTeamForUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searches = await getSavedSearchesForTeam(team.id);
    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Failed to load saved searches:', error);
    return NextResponse.json(
      { error: 'Failed to load saved searches' },
      { status: 500 }
    );
  }
}
