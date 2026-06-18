import { redirect } from 'next/navigation';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ mode: 'signin' });

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') query.set(key, value);
  });

  redirect(`/login?${query.toString()}`);
}
