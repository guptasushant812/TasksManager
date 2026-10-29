import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tasks Workspace',
  description: 'Private workspace for viewing, filtering, and managing daily task timesheets and assignment details.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/tasks',
  },
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
