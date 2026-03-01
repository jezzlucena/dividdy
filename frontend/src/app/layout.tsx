import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dividdy - Split Expenses Easily',
  description: 'Simplify managing and settling shared expenses for groups. Track who paid for what and calculate who owes whom.',
  keywords: ['expense splitting', 'group expenses', 'split bills', 'shared costs', 'trip expenses'],
  other: {
    'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
