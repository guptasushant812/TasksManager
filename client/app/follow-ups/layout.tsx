import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Follow-Ups',
  description: 'Log and review follow-up conversations, reminders, attachments, and progress milestones on active tasks.',
  alternates: {
    canonical: '/follow-ups',
  },
  openGraph: {
    title: 'Follow-Ups | TasksManager',
    description: 'Log and review follow-up conversations, reminders, attachments, and progress milestones on active tasks.',
    url: '/follow-ups',
  },
};

export default function FollowUpsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
