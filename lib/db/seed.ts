import { eq } from 'drizzle-orm';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { seedDashboardContent } from './seed-content';

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL || 'hello@fyndlater.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Fynd#231';
  const name = 'FyndLater Admin';

  const passwordHash = await hashPassword(password);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let user = existing[0];

  if (user) {
    [user] = await db
      .update(users)
      .set({
        name,
        passwordHash,
        role: 'owner',
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    console.log(`Updated existing admin user: ${email}`);
  } else {
    [user] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        role: 'owner',
      })
      .returning();
    console.log(`Created admin user: ${email}`);
  }

  const membership = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  let teamId: number;

  if (membership.length > 0) {
    teamId = membership[0].teamId;
    console.log('Admin team membership already exists.');
  } else {
    const [team] = await db
      .insert(teams)
      .values({
        name: 'FyndLater',
        planName: 'Pro',
        subscriptionStatus: 'active',
      })
      .returning();

    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: 'owner',
    });

    teamId = team.id;
    console.log(`Created team "${team.name}" for admin user.`);
  }

  await seedDashboardContent(teamId, user.id);
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
