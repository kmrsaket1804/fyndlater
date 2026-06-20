'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  users,
  teams,
  teamMembers,
  activityLogs,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  type NewActivityLog,
  ActivityType,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { validatedAction } from '@/lib/auth/middleware';
import { verifyRecaptchaToken } from '@/lib/recaptcha';

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
});

const authenticateSchema = signInSchema.extend({
  mode: z.enum(['signin', 'signup']),
});

export const authenticate = validatedAction(
  authenticateSchema,
  async (data, formData) => {
    const recaptcha = await verifyRecaptchaToken(
      formData.get('recaptchaToken') as string | null
    );
    if (!recaptcha.success) {
      return {
        error: recaptcha.error,
        email: data.email,
        password: data.password,
      };
    }

    try {
      if (data.mode === 'signup') {
        return await signUpHandler(
          {
            email: data.email,
            password: data.password,
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
  const { email, password } = data;

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

  const newTeam: NewTeam = {
    name: `${email.split('@')[0]}'s saves`,
  };

  const [createdTeam] = await db.insert(teams).values(newTeam).returning();

  if (!createdTeam) {
    return {
      error: 'Failed to create workspace. Please try again.',
      email,
      password,
    };
  }

  const newTeamMember: NewTeamMember = {
    userId: createdUser.id,
    teamId: createdTeam.id,
    role: 'owner',
  };

  await db.insert(teamMembers).values(newTeamMember);
  await logActivity(createdTeam.id, createdUser.id, ActivityType.CREATE_TEAM);
  await logActivity(createdTeam.id, createdUser.id, ActivityType.SIGN_UP);
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
