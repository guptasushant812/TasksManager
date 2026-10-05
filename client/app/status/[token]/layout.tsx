import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tasks Status',
  description: 'Live read-only task milestone tracking, pending queue, and completed tasks overview on TasksManager.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Live Tasks Status | TasksManager',
    description: 'Live read-only task milestone tracking, pending queue, and completed tasks overview on TasksManager.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Tasks Status | TasksManager',
    description: 'Live read-only task milestone tracking, pending queue, and completed tasks overview on TasksManager.',
    images: ['/og-image.png'],
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
