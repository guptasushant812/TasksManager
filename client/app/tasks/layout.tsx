import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'View, filter, and manage tasks with real-time status tracking, priority flags, and assignment details.',
  alternates: {
    canonical: '/tasks',
  },
  openGraph: {
    title: 'Tasks | TasksManager',
    description: 'View, filter, and manage tasks with real-time status tracking, priority flags, and assignment details.',
    url: '/tasks',
  },
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
