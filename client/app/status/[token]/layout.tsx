import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Status',
  description: 'Live read-only project milestone tracking, pending queue, and completed tasks overview.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Live Project Status | TasksManager',
    description: 'Live read-only project milestone tracking, pending queue, and completed tasks overview.',
  },
  twitter: {
    card: 'summary',
    title: 'Live Project Status | TasksManager',
    description: 'Live read-only project milestone tracking, pending queue, and completed tasks overview.',
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
