import { getUser } from '@/lib/db/queries';
import {
  createConnectCodeForUser,
  getLinkedInstagramForUser,
  getOrCreateConnectCodeForUser,
} from '@/lib/instagram/connect';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const linked = await getLinkedInstagramForUser(user.id);
  if (linked) {
    return Response.json({
      linked: true,
      linkedAt: linked.updatedAt.toISOString(),
    });
  }

  const code = await getOrCreateConnectCodeForUser(user.id);

  return Response.json({
    linked: false,
    code: code.code,
    expiresAt: code.expiresAt.toISOString(),
  });
}

export async function POST() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const linked = await getLinkedInstagramForUser(user.id);
  if (linked) {
    return Response.json({
      linked: true,
      linkedAt: linked.updatedAt.toISOString(),
    });
  }

  const code = await createConnectCodeForUser(user.id);

  return Response.json({
    linked: false,
    code: code.code,
    expiresAt: code.expiresAt.toISOString(),
  });
}
