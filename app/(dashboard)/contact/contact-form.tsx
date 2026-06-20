'use client';

import { useActionState, useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RecaptchaField } from '@/components/recaptcha-field';
import { submitContactForm, type ContactFormState } from './actions';

const initialState: ContactFormState = { success: false, error: '' };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactForm,
    initialState
  );
  const [captchaKey, setCaptchaKey] = useState(0);

  useEffect(() => {
    if (state.error) {
      setCaptchaKey((key) => key + 1);
    }
  }, [state.error]);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-8 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-lg font-semibold text-gray-900">Message sent!</h3>
        <p className="mt-2 text-sm text-gray-600">
          Thanks for reaching out. We&apos;ll get back to you within 24 hours
          during business days.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full Name *
          </Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={100}
            placeholder="Your name"
            className="mt-1.5 rounded-xl"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            maxLength={100}
            placeholder="you@example.com"
            className="mt-1.5 rounded-xl"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
          Subject *
        </Label>
        <Input
          id="subject"
          name="subject"
          required
          maxLength={150}
          placeholder="How can we help?"
          className="mt-1.5 rounded-xl"
        />
      </div>

      <div>
        <Label htmlFor="message" className="text-sm font-medium text-gray-700">
          Message *
        </Label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          maxLength={2000}
          placeholder="Tell us about your question or feedback..."
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <RecaptchaField key={captchaKey} />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-full px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 transition-all disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send Message
            <Send className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-xs text-gray-500">
        By submitting this form, you agree to our{' '}
        <a href="/privacy" className="text-violet-600 hover:underline">
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href="/terms" className="text-violet-600 hover:underline">
          Terms of Service
        </a>
        .
      </p>
    </form>
  );
}
