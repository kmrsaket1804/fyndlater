import { NextResponse } from 'next/server';
import { buildMetaOAuthUrl } from '@/lib/meta/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.redirect(buildMetaOAuthUrl('faye_setup'));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Meta OAuth is not configured';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
