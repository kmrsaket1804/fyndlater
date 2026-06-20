'use server';

import { z } from 'zod';
import { verifyRecaptchaToken } from '@/lib/recaptcha';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Please enter a valid email address').max(100),
  subject: z.string().min(1, 'Subject is required').max(150),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export type ContactFormState = {
  success: boolean;
  error: string;
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Please check your input.',
    };
  }

  const recaptcha = await verifyRecaptchaToken(
    formData.get('recaptchaToken') as string | null
  );
  if (!recaptcha.success) {
    return { success: false, error: recaptcha.error };
  }

  // Contact submissions can be wired to email/CRM later.
  // For now, validate and acknowledge receipt.
  console.log('Contact form submission:', parsed.data);

  return { success: true, error: '' };
}
