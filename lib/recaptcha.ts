import 'server-only';

type VerifyResult =
  | { success: true }
  | { success: false; error: string };

export function isRecaptchaEnabled() {
  return Boolean(
    process.env.RECAPTCHA_SECRET_KEY &&
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  );
}

export async function verifyRecaptchaToken(
  token: string | null | undefined
): Promise<VerifyResult> {
  if (!isRecaptchaEnabled()) {
    return { success: true };
  }

  if (!token) {
    return {
      success: false,
      error: 'Please complete the reCAPTCHA challenge.',
    };
  }

  const response = await fetch(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY!,
        response: token,
      }),
    }
  );

  const data = (await response.json()) as {
    success: boolean;
    score?: number;
    action?: string;
    'error-codes'?: string[];
  };

  if (!data.success) {
    console.error('reCAPTCHA verification failed:', data['error-codes']);
    return {
      success: false,
      error: 'reCAPTCHA verification failed. Please try again.',
    };
  }

  if (typeof data.score === 'number' && data.score < 0.5) {
    return {
      success: false,
      error: 'reCAPTCHA verification failed. Please try again.',
    };
  }

  return { success: true };
}
