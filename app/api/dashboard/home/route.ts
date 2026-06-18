import { NextResponse } from 'next/server';
import { getDashboardHomeData } from '@/lib/db/dashboard-queries';

export async function GET() {
  try {
    const data = await getDashboardHomeData();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Team not found') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error('Failed to load dashboard home data:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
