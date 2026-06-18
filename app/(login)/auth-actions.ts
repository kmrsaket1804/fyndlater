'use server';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  users,
  teams,
  teamMembers,
  activityLogs,
  invitations,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  type NewActivityLog,
  ActivityType,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { validatedAction } from '@/lib/auth/middleware';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType
) {
  if (!teamId) return;

  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: '',
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
});

const authenticateSchema = signInSchema.extend({
  mode: z.enum(['signin', 'signup']),
  inviteId: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const authenticate = validatedAction(
  authenticateSchema,
  async (data, formData) => {
    try {
      if (data.mode === 'signup') {
        return await signUpHandler(
          {
            email: data.email,
            password: data.password,
            inviteId: data.inviteId,
          },
          formData
        );
      }

      return await signInHandler(data, formData);
    } catch (error) {
      console.error('Authentication failed:', error);
      return {
        error: 'Something went wrong. Please try again.',
        email: data.email,
        password: data.password,
      };
    }
  }
);

async function signInHandler(
  data: z.infer<typeof signInSchema>,
  formData: FormData
) {
  const { email, password } = data;

  const userWithTeam = await db
    .select({
      user: users,
      team: teams,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithTeam.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0];

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  await setSession(foundUser);
  await logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const planId = formData.get('planId') as string;
    const { createCashfreeCheckout } = await import('@/lib/payments/cashfree');
    return createCashfreeCheckout({
      team: foundTeam,
      user: foundUser,
      planId,
    });
  }

  return { redirectTo: '/dashboard' };
}

async function signUpHandler(
  data: z.infer<typeof signUpSchema>,
  formData: FormData
) {
  const { email, password, inviteId } = data;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error: 'An account with this email already exists. Please sign in.',
      email,
      password,
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    role: 'owner',
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create account. Please try again.',
      email,
      password,
    };
  }

  let teamId: number;
  let userRole: string;
  let createdTeam: typeof teams.$inferSelect | null = null;

  if (inviteId) {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, parseInt(inviteId)),
          eq(invitations.email, email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (!invitation) {
      return { error: 'Invalid or expired invitation.', email, password };
    }

    teamId = invitation.teamId;
    userRole = invitation.role;

    await db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id));

    await logActivity(teamId, createdUser.id, ActivityType.ACCEPT_INVITATION);

    [createdTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);
  } else {
    const newTeam: NewTeam = {
      name: `${email.split('@')[0]}'s saves`,
    };

    [createdTeam] = await db.insert(teams).values(newTeam).returning();

    if (!createdTeam) {
      return {
        error: 'Failed to create workspace. Please try again.',
        email,
        password,
      };
    }

    teamId = createdTeam.id;
    userRole = 'owner';
    await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM);
  }

  const newTeamMember: NewTeamMember = {
    userId: createdUser.id,
    teamId,
    role: userRole,
  };

  await db.insert(teamMembers).values(newTeamMember);
  await logActivity(teamId, createdUser.id, ActivityType.SIGN_UP);
  await setSession(createdUser);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const planId = formData.get('planId') as string;
    const { createCashfreeCheckout } = await import('@/lib/payments/cashfree');
    return createCashfreeCheckout({
      team: createdTeam,
      user: createdUser,
      planId,
    });
  }

  return { redirectTo: '/dashboard' };
}

export const signIn = validatedAction(signInSchema, signInHandler);
export const signUp = validatedAction(signUpSchema, signUpHandler);
