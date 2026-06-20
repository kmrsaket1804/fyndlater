import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'FyndLater — Your AI memory for everything you save',
  description:
    'Send it to Faye. Fynd it later. FyndLater is your AI memory assistant — save reels, posts, links, and ideas on Instagram, then find them later with natural language.',
  icons: {
    icon: '/assets/favicon.ico',
    apple: '/assets/fyndlater-logo-sq.png',
  },
};

export const viewport: Viewport = {
  maximumScale: 1
};

const inter = Inter({ subsets: ['latin'] });

async function safeGetUser() {
  try {
    return await getUser();
  } catch (error) {
    console.error('Failed to load user for layout:', error);
    return null;
  }
}

async function safeGetTeam() {
  try {
    return await getTeamForUser();
  } catch (error) {
    console.error('Failed to load team for layout:', error);
    return null;
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${inter.className}`}
    >
      <body className="min-h-[100dvh] bg-white">
        <SWRConfig
          value={{
            fallback: {
              '/api/user': safeGetUser(),
              '/api/team': safeGetTeam(),
            }
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
