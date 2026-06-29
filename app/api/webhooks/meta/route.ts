import { NextRequest, NextResponse } from 'next/server';
import { isMetaConfigured } from '@/lib/meta/config';
import { handleMetaWebhookPayload } from '@/lib/meta/handle-webhook';
import {
  verifyWebhookChallenge,
  verifyWebhookSignature,
} from '@/lib/meta/webhook-verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Meta allows ~20s; process inline so DM send completes before the function exits.
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!isMetaConfigured()) {
    return new NextResponse('Meta webhook not configured', { status: 503 });
  }

  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  const verifiedChallenge = verifyWebhookChallenge(mode, token, challenge);

  if (verifiedChallenge) {
    return new NextResponse(verifiedChallenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!isMetaConfigured()) {
    return new NextResponse('Meta webhook not configured', { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[meta] Invalid webhook signature');
    return new NextResponse('Forbidden', { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.warn('[meta] Invalid webhook JSON payload');
    return new NextResponse('Bad Request', { status: 400 });
  }

  try {
    await handleMetaWebhookPayload(payload);
  } catch (error) {
    console.error(
      '[meta] Webhook processing failed:',
      error instanceof Error ? error.message : error
    );
  }

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
