import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Follow-Ups Workspace',
  description: 'Private workspace for logging follow-up communication, interaction logs, reminders, and escalation tracking.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/follow-ups',
  },
};

export default function FollowUpsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
